"use server";

export async function checkNote(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title) {
    return { error: "Please enter a title." };
  }

  if (!body) {
    return { error: "Please enter your note." };
  }

  const tags = [
    ...new Set(
      String(formData.get("tags") ?? "")
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];

  return {
    note: {
      id: crypto.randomUUID(),
      title,
      body,
      tags,
    },
  };
}