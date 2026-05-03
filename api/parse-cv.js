async function readMultipartFile(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const buffer = Buffer.concat(chunks);
  const contentType = req.headers["content-type"] || "";
  const boundary = contentType.split("boundary=")[1];

  if (!boundary) {
    throw new Error("Brak pliku w zapytaniu");
  }

  const parts = buffer.toString("binary").split(`--${boundary}`);

  const filePart = parts.find(
    (part) =>
      part.includes("Content-Disposition") &&
      part.includes("filename=")
  );

  if (!filePart) {
    throw new Error("Nie znaleziono pliku CV");
  }

  const filenameMatch = filePart.match(/filename="(.+?)"/);
  const filename = filenameMatch?.[1] || "cv.pdf";

  const typeMatch = filePart.match(/Content-Type: (.+?)\r\n/);
  const mimeType = typeMatch?.[1] || "application/pdf";

  const headerEnd = filePart.indexOf("\r\n\r\n");
  const fileBinary = filePart.slice(
    headerEnd + 4,
    filePart.lastIndexOf("\r\n")
  );

  return {
    filename,
    mimeType,
    buffer: Buffer.from(fileBinary, "binary"),
  };
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Brak OPENAI_API_KEY w Vercel" });
    }

    const { filename, mimeType, buffer } = await readMultipartFile(req);

    const uploadForm = new FormData();
    uploadForm.append(
      "file",
      new Blob([buffer], { type: mimeType }),
      filename
    );
    uploadForm.append("purpose", "user_data");

    const uploadResponse = await fetch("https://api.openai.com/v1/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: uploadForm,
    });

    const uploadedFile = await uploadResponse.json();

    if (!uploadResponse.ok) {
      return res.status(500).json({
        error: uploadedFile.error?.message || "Błąd uploadu pliku do OpenAI",
      });
    }

    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `
Wyciągnij dane z CV albo zdjęcia CV.

Zwróć WYŁĄCZNIE poprawny JSON bez markdown:

{
  "name": "",
  "email": "",
  "telefon": "",
  "linkedin": "",
  "lokalizacja": "",
  "doświadczenie": "",
  "jezyk_programowania": "",
  "framework": "",
  "obszar": "",
  "tagi": "",
  "notatki": ""
}

Zasady:
- "doświadczenie" wpisz krótko, np. "5 lat"
- "obszar" wybierz jako: Frontend, Backend, Fullstack, DevOps / SRE, Data, Mobile, QA, Product / PO, Sales / Nieruchomości albo Inne
- "tagi" wpisz po przecinku, np. Senior, React, Remote
- "notatki" po polsku, krótki opis profilu kandydata
- jeśli czegoś nie ma w CV, zostaw pusty string
                `,
              },
              {
                type: "input_file",
                file_id: uploadedFile.id,
              },
            ],
          },
        ],
      }),
    });

    const aiData = await aiResponse.json();

    if (!aiResponse.ok) {
      return res.status(500).json({
        error: aiData.error?.message || "Błąd OpenAI",
      });
    }

    const text =
      aiData.output_text ||
      aiData.output?.[0]?.content?.[0]?.text ||
      "{}";

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
