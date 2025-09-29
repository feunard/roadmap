import { Alepha, run } from "alepha";
import { AlephaReactHead } from "alepha/react/head";
import { AppRouter } from "./AppRouter.js";
import { I18n } from "./locales/I18n.js";

//
// This is the browser-side entry point
//

const alepha = Alepha.create({
	env: {},
});

alepha.with(AlephaReactHead);
alepha.with(AppRouter);
alepha.with(I18n);

run(alepha);
