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

const themes = [
  { value: "cream", label: "Sandstone" },
  { value: "midnight", label: "Ocean Night" },
  { value: "forest", label: "Sage Garden" },
  { value: "lavender", label: "Rosewood" },
];

function isNote(value: unknown): value is Note {
  if (typeof value !== "object" || value === null) return false;

  const note = value as Record<string, unknown>;

  return (
    typeof note.id === "string" &&
    typeof note.title === "string" &&
    typeof note.body === "string" &&
    Array.isArray(note.tags) &&
    note.tags.every((tag: unknown) => typeof tag === "string")
  );
}

function tagColor(tag: string) {
  const total = [...tag].reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0
  );

  return `nest-tag-${total % 4}`;
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [theme, setTheme] = useState("cream");

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("notenest-theme");
      const chosen = themes.some((item) => item.value === savedTheme)
        ? savedTheme!
        : "cream";

      setTheme(chosen);
      document.documentElement.dataset.notesTheme = chosen;
    } catch {
      document.documentElement.dataset.notesTheme = "cream";
    }

    try {
      const saved = localStorage.getItem("markdown-notes");

      if (saved) {
        const parsed: unknown = JSON.parse(saved);

        if (!Array.isArray(parsed) || !parsed.every(isNote)) {
          throw new Error("Invalid saved notes");
        }

        setNotes(parsed);
      }

      setLoaded(true);
    } catch {
      setError(
        "Saved notes could not be loaded. Please keep this page open and avoid adding notes until this is resolved."
      );
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem("markdown-notes", JSON.stringify(notes));
    } catch {
      setError(
        "Your latest changes could not be saved. Please keep this page open."
      );
    }
  }, [notes, loaded]);

  function changeTheme(value: string) {
    if (!themes.some((item) => item.value === value)) return;

    setTheme(value);
    document.documentElement.dataset.notesTheme = value;

    try {
      localStorage.setItem("notenest-theme", value);
    } catch {
      // The theme can still change without saving the preference.
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loaded || saving) return;

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
        setSelectedTag(null);
        setSearchQuery("");
        form.reset();
      }
    } catch {
      setError("Your note could not be added. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function deleteNote(id: string) {
    const remaining = notes.filter((note) => note.id !== id);
    setNotes(remaining);

    if (
      selectedTag &&
      !remaining.some((note) => note.tags.includes(selectedTag))
    ) {
      setSelectedTag(null);
    }
  }

  const allTags = [...new Set(notes.flatMap((note) => note.tags))].sort();
  const query = searchQuery.trim().toLowerCase();

  const filteredNotes = notes.filter((note) => {
    const matchesTag =
      selectedTag === null || note.tags.includes(selectedTag);

    const matchesSearch =
      note.title.toLowerCase().includes(query) ||
      note.body.toLowerCase().includes(query);

    return matchesTag && matchesSearch;
  });

  return (
    <main className="nest-page">
      <div className="nest-atmosphere" aria-hidden="true">
        <span className="nest-glow nest-glow-one" />
        <span className="nest-glow nest-glow-two" />
        <span className="nest-glow nest-glow-three" />
        <div className="nest-dot-pattern" />
      </div>

      <div className="nest-container">
        <header className="nest-header">
          <div>
            <p className="nest-eyebrow">
              <span className="nest-status-dot" aria-hidden="true" />
              Your everyday space
            </p>

            <h1>
              NoteNest<span>.</span>
            </h1>

            <p className="nest-introduction">
              A home for your thoughts. Capture ideas, stay organised,
              and find what matters.
            </p>
          </div>

          <label htmlFor="theme" className="nest-theme-picker">
            Theme
            <select
              id="theme"
              value={theme}
              onChange={(event) => changeTheme(event.target.value)}
            >
              {themes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </header>

        <div className="nest-layout">
          <section
            className="nest-editor nest-panel"
            aria-labelledby="new-note-heading"
          >
            <span className="nest-section-label">CAPTURE SOMETHING</span>
            <h2 id="new-note-heading">Make room for an idea</h2>

            <p className="nest-muted nest-section-intro">
              A quick thought or a detailed plan—it belongs here.
            </p>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="nest-form"
            >
              <div>
                <label htmlFor="title">Title</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="Give your note a title"
                />
              </div>

              <div>
                <label htmlFor="body">Your note</label>
                <textarea
                  id="body"
                  name="body"
                  rows={7}
                  placeholder="What’s on your mind?"
                  aria-describedby="markdown-help"
                />
                <p id="markdown-help" className="nest-help">
                  Markdown supported: # Heading, **bold**, - list item
                </p>
              </div>

              <div>
                <label htmlFor="tags">
                  Tags <span className="nest-optional">optional</span>
                </label>
                <input
                  id="tags"
                  name="tags"
                  type="text"
                  placeholder="work, church, home"
                  aria-describedby="tags-help"
                />
                <p id="tags-help" className="nest-help">
                  Separate tags with commas.
                </p>
              </div>

              {error && (
                <p role="alert" className="nest-error">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={saving || !loaded}
                className="nest-submit"
              >
                {saving ? "Adding..." : "Add note"}
                <span aria-hidden="true"> ↗</span>
              </button>

              <p className="nest-storage-note">
                Notes are stored in this browser on this device.
              </p>
            </form>
          </section>

          <section
            className="nest-collection"
            aria-labelledby="notes-heading"
          >
            <div className="nest-collection-heading">
              <div>
                <span className="nest-section-label">
                  KEEP WHAT MATTERS
                </span>
                <h2 id="notes-heading">Your collection</h2>
              </div>

              <span className="nest-count">
                {filteredNotes.length} of {notes.length}
              </span>
            </div>

            <div className="nest-search">
              <label htmlFor="search">Search notes</label>
              <input
                id="search"
                type="search"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Find a thought, idea or keyword..."
              />
            </div>

            <div
              role="group"
              aria-label="Filter notes by tag"
              className="nest-filters"
            >
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                aria-pressed={selectedTag === null}
                className="nest-tag"
              >
                All
              </button>

              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  aria-pressed={selectedTag === tag}
                  className={`nest-tag ${tagColor(tag)}`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div aria-live="polite" className="nest-notes">
              {!loaded && !error && (
                <p className="nest-muted">Loading your notes...</p>
              )}

              {loaded && filteredNotes.length === 0 && (
                <div className="nest-empty">
                  <span className="nest-empty-icon" aria-hidden="true">
                    ✎
                  </span>
                  <h3>
                    {notes.length === 0
                      ? "Your next idea starts here."
                      : "No notes match."}
                  </h3>
                  <p className="nest-muted">
                    {notes.length === 0
                      ? "Add your first note using the form."
                      : "Try another search or choose a different tag."}
                  </p>
                </div>
              )}

              {filteredNotes.map((note) => (
                <article
                  key={note.id}
                  className="nest-note nest-panel"
                >
                  <div className="nest-note-heading">
                    <h3>{note.title}</h3>
                    <button
                      type="button"
                      onClick={() => deleteNote(note.id)}
                      aria-label={`Delete note: ${note.title}`}
                      className="nest-delete"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="note-markdown">
                    <ReactMarkdown>{note.body}</ReactMarkdown>
                  </div>

                  {note.tags.length > 0 && (
                    <div className="nest-note-tags">
                      {note.tags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setSelectedTag(tag)}
                          aria-pressed={selectedTag === tag}
                          className={`nest-tag ${tagColor(tag)}`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        </div>

        <footer className="nest-footer">
          NoteNest — a little space for everything on your mind.
        </footer>
      </div>
    </main>
  );
}