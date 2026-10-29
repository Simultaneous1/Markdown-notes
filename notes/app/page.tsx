"use client";
import ReactMarkdown from "react-markdown";   
import { useEffect, useState, type FormEvent } from "react";
import { checkNote } from "./actions";

type Note = {
  id: string;
  title: string;
  body: string;
  tags: string[];
};

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

useEffect(() => {
  try {
    const saved = localStorage.getItem("markdown-notes");

    if (saved) {
      const parsed: unknown = JSON.parse(saved);

      if (
        !Array.isArray(parsed) ||
        !parsed.every(
          (note) =>
            note !== null &&
            typeof note === "object" &&
            typeof note.id === "string" &&
            typeof note.title === "string" &&
            typeof note.body === "string" &&
            Array.isArray(note.tags) &&
            note.tags.every((tag: unknown) => typeof tag === "string")
        )
      ) {
        throw new Error("Invalid saved notes");
      }

      setNotes(parsed as Note[]);
    }

    setLoaded(true);
  } catch {
    setError(
      "Saved notes could not be loaded. Please avoid adding notes until this is resolved."
    );
  }
}, []);

useEffect(() => {
  if (!loaded) return;

  try {
    localStorage.setItem("markdown-notes", JSON.stringify(notes));
  } catch {
    setError(
      "Your latest changes could not be saved in this browser. Please keep this page open."
    );
  }
}, [notes, loaded]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setError("");
    setSaving(true);

    try {
      const result = await checkNote(formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.note) {
        setNotes((previous) => [result.note, ...previous]);
        form.reset();
      }
    } catch {
      setError("Your note could not be added. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const allTags = [
  ...new Set(notes.flatMap((note) => note.tags)),
  ].sort();
 
  const filteredNotes = selectedTag
  ? notes.filter((note) => note.tags.includes(selectedTag))
  : notes;

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">My Notes</h1>
          <p className="mt-2 text-slate-600">
            A simple place for your thoughts, ideas and everyday notes.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-5 text-xl font-semibold">New note</h2>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="title" className="mb-2 block font-medium">
                Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="For example, Shopping"
                className="w-full rounded-lg border border-slate-300 p-3"
              />
            </div>

            <div>
              <label htmlFor="body" className="mb-2 block font-medium">
                Note
              </label>
              <textarea
                id="body"
                name="body"
                rows={6}
                placeholder="Write your note here..."
                className="w-full rounded-lg border border-slate-300 p-3"
              />
            </div>

            <div>
              <label htmlFor="tags" className="mb-2 block font-medium">
                Tags
              </label>
              <input
                id="tags"
                name="tags"
                type="text"
                placeholder="work, church, home"
                aria-describedby="tags-help"
                className="w-full rounded-lg border border-slate-300 p-3"
              />
              <p id="tags-help" className="mt-2 text-sm text-slate-500">
                Optional. Separate tags with commas.
              </p>
            </div>

            {error && (
              <p role="alert" className="text-sm font-medium text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving || !loaded}
              className="rounded-lg bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
            >
              {saving ? "Adding..." : "Add note"}
            </button>
          </form>
        </section>

        <section className="mt-10" aria-labelledby="notes-heading">
          <h2 id="notes-heading" className="mb-5 text-xl font-semibold">
            Your notes ({notes.length})
          </h2>

        <button
          type="button"
          onClick={() => setSelectedTag(null)}
          className="mb-5 rounded-full bg-teal-700 px-4 py-2 text-sm text-white"
        >
          All
        </button> 

          <div aria-live="polite" className="space-y-4">
            {notes.length === 0 && (
              <p className="text-slate-500">
                No notes yet. Add your first note above.
              </p>
            )}

            {filteredNotes.map((note) => (
              <article
                key={note.id}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <h3 className="break-words text-lg font-semibold">
                  {note.title}
                </h3>

                <div className="note-markdown mt-3 break-words text-slate-700">
                <ReactMarkdown>{note.body}</ReactMarkdown>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {note.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className="max-w-full break-words rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-800 hover:bg-teal-100"
                >
                  {tag}
                </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}