import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("HomePage");
  return (
    <main className="flex justify-center items-center">
      <div className="font-bold text-3xl">{t("lamine")}</div>
    </main>
  );
}
