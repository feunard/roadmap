import { Alepha, run } from "alepha";
import { AlephaReactAuth } from "alepha/react/auth";
import { AlephaReactForm } from "alepha/react/form";
import { AppRouter } from "./AppRouter.js";
import { RoadmapServices } from "./services/index.js";

const alepha = Alepha.create();

alepha.with(AlephaReactAuth);
alepha.with(AlephaReactForm);
alepha.with(RoadmapServices);

alepha.with(AppRouter);

run(alepha);
