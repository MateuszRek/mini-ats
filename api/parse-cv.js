async function readMultipartFile(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);

  const buffer = Buffer.concat(chunks);
  const contentType = req.headers["content-type"] || "";
  const boundary = contentType.split("boundary=")[1];

  if (!boundary) throw new Error("Brak pliku w zapytaniu");

  const parts = buffer.toString("binary").split(`--${boundary}`);
  const filePart = parts.find(
    (part) => part.includes("Content-Disposition") && part.includes("filename=")
  );

  if (!filePart) throw new Error("Nie znaleziono pliku CV");

  const filename = filePart.match(/filename="(.+?)"/)?.[1] || "cv.pdf";
  const mimeType = filePart.match(/Content-Type: (.+?)\r\n/)?.[1] || "application/pdf";

  const headerEnd = filePart.indexOf("\r\n\r\n");
  const fileBinary = filePart.slice(headerEnd + 4, filePart.lastIndexOf("\r\n"));

  return {
    filename,
    mimeType,
    buffer: Buffer.from(fileBinary, "binary"),
  };
}

function extractOutputText(data) {
  return (
    data.output_text ||
    data.output?.[0]?.content?.[0]?.text ||
    data.output?.[0]?.content?.[0]?.content ||
    "{}"
  );
}

function cleanJson(text) {
  return String(text)
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

const jsonInstruction = `
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
- "notatki" po polsku: krótki opis profilu + Twoja ocena kandydata, np. mocne strony, ryzyka, do jakiego typu roli pasuje
- jeśli czegoś nie ma, zostaw pusty string
`;

async function askOpenAI(input) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Błąd OpenAI");
  }

  const text = cleanJson(extractOutputText(data));
  return JSON.parse(text);
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Brak OPENAI_API_KEY w Vercel" });
    }

    const contentType = req.headers["content-type"] || "";

    if (contentType.includes("application/json")) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString("utf8");
      const body = JSON.parse(raw || "{}");

      const linkedinUrl = body.linkedinUrl || "";
      const linkedinText = body.linkedinText || "";

      const parsed = await askOpenAI([
        {
          role: "user",
          content: `
Przeanalizuj dane z profilu LinkedIn.

Link:
${linkedinUrl}

Tekst profilu:
${linkedinText}

${jsonInstruction}
          `,
        },
      ]);

      return res.status(200).json(parsed);
    }

    const { filename, mimeType, buffer } = await readMultipartFile(req);

    const uploadForm = new FormData();
    uploadForm.append("file", new Blob([buffer], { type: mimeType }), filename);
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

    const parsed = await askOpenAI([
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `
Wyciągnij dane z CV albo zdjęcia CV.

${jsonInstruction}
            `,
          },
          {
            type: "input_file",
            file_id: uploadedFile.id,
          },
        ],
      },
    ]);

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
