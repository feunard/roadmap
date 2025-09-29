import { Link, NestedView, useActive, useRouter } from "alepha/react";
import { useI18n } from "alepha/react/i18n";
import type { ReactNode } from "react";
import type { AppRouter } from "../AppRouter.js";
import type { I18n } from "../locales/I18n.js";

const MenuItem = (props: { href: string; children: ReactNode }) => {
	const { anchorProps, isActive } = useActive(props.href);
	return (
		<Link {...anchorProps} className={isActive ? "active" : ""}>
			{props.children}
		</Link>
	);
};

const LanguageSwitcher = () => {
	const i18n = useI18n<I18n, "en">();

	const onSetLang = (key: string) => {
		return async () => {
			await i18n.setLang(key);
		};
	};

	return (
		<div>
			<button
				disabled={i18n.lang === "en"}
				type="button"
				onClick={onSetLang("en")}
			>
				En
			</button>
			<button
				disabled={i18n.lang === "fr"}
				type="button"
				onClick={onSetLang("fr")}
			>
				Fr
			</button>
		</div>
	);
};

const Layout = () => {
	const router = useRouter<AppRouter>();
	const { tr } = useI18n<I18n, "en">();
	return (
		<div>
			<LanguageSwitcher />
			<fieldset>
				<legend>{tr("home.title")}</legend>
				<ul>
					<li>
						<MenuItem href={router.path("home")}>{tr("nav.home")}</MenuItem>
					</li>
					<li>
						<MenuItem href={router.path("taskCreate")}>
							{tr("nav.addTask")}
						</MenuItem>
					</li>
				</ul>
				<NestedView />
			</fieldset>
		</div>
	);
};

export default Layout;
