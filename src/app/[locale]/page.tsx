import { redirect } from "@/i18n/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

// The patient app has no marketing landing — the root locale path sends people
// into the portal, where the proxy gates unauthenticated visits to sign-in.
export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  redirect({ href: "/patient", locale });
}
