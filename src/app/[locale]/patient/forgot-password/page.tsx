import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Footer from "@/components/common/Footer";
import { Link } from "@/i18n/navigation";
import { PatientForgotPasswordForm } from "@/features/auth/components/PatientForgotPasswordForm";
import LogoIcon from "@/public/Logo-icon.png";
import Logo from "@/public/Logo.png";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PatientForgotPasswordPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.patientForgotPassword");

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
          {t("backToSignIn")}
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-100 flex flex-col items-center gap-5">
          <Image
            src={LogoIcon}
            alt="Cradlen"
            loading="eager"
            width={100}
            height={100}
          />

          <div className="flex flex-col items-center gap-1.5 text-center">
            <h1 className="text-xl font-medium text-brand-black">
              {t("title")}
            </h1>
            <p className="text-sm text-gray-500">{t("subtitle")}</p>
          </div>

          <PatientForgotPasswordForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
