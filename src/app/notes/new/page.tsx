import { redirect } from "next/navigation";

/** Old URL: new note now opens inline on the Notes tab. */
export default function NotesNewRedirectPage() {
  redirect("/?tab=notes");
}
