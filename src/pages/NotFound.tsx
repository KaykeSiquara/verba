import { Link } from "react-router";
import { usePrefs } from "../app/prefs";
import { buttonClass } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";

export default function NotFound() {
  const { t } = usePrefs();
  return (
    <div className="py-16 text-center">
      <PageHeader title={t("notfound.title")} />
      <p className="-mt-3 mb-6 text-fg-muted">{t("notfound.body")}</p>
      <Link to="/" className={buttonClass("primary")}>{t("notfound.back")}</Link>
    </div>
  );
}
