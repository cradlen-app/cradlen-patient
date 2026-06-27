import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Footer from "@/components/common/Footer";
import { Link } from "@/i18n/navigation";
import { PatientSignUpForm } from "@/features/auth/components/PatientSignUpForm";
import LogoIcon from "@/public/Logo-icon.png";
import Logo from "@/public/Logo.png";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PatientSignUpPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.patientSignUp");

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-8 sm:py-5">
        <Link
          href="/"
          aria-label="Cradlen home"
          className="inline-flex w-24 shrink-0 sm:w-30"
        >
          <Image src={Logo} alt="CRADLEN" loading="eager" className="h-auto w-full" />
        </Link>
        <Link
          href="/patient/signin"
          className="text-end text-sm text-brand-secondary transition-opacity hover:opacity-80 sm:text-base"
        >
          {t("alreadyHaveAccount")}
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-5">
        <div className="w-full max-w-xl flex flex-col items-center gap-7">
          <Image
            src={LogoIcon}
            alt="Cradlen"
            loading="eager"
            width={100}
            height={100}
          />

          <PatientSignUpForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
