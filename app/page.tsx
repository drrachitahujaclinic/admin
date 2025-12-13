import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = cookies();
  const session = (await cookieStore).get("app_session");

  if (!session) {
    redirect("/login");
  }

  redirect("/admin");
}
