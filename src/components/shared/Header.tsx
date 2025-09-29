import { Burger, Container, Drawer, Flex } from "@mantine/core";
import { useRouter, useRouterEvents, useStore } from "alepha/react";
import { useState } from "react";
import type { AppRouter } from "../../AppRouter.js";
import { theme } from "../../constants/theme.js";
import ProjectActions from "../project/ProjectActions.jsx";
import QuestLog from "../project/QuestLog.jsx";
import Action from "../ui/Action.jsx";
import HeaderActions from "./HeaderActions.jsx";
import HeaderProject from "./HeaderProject.jsx";
import RoadmapLogo from "./RoadmapLogo.jsx";

const Header = () => {
	const router = useRouter<AppRouter>();

	return (
		<Flex
			direction={"column"}
			p={"xs"}
			px={"md"}
			gap={"xs"}
			mah={64}
			align="center"
			justify="center"
		>
			<Flex w={"100%"} px={2}>
				<Flex flex={1} gap={"xs"}>
					<Flex align="center" justify="center" gap={"xs"}>
						<MobileQuestLog />
						<Flex>
							<Action
								variant={"subtle"}
								href={router.path("home")}
								active={false}
								leftSection={<RoadmapLogo />}
							/>
						</Flex>
						<HeaderProject />
					</Flex>
				</Flex>
				<Container w={theme.container} visibleFrom={"lg"} p={0}>
					<ProjectActions />
				</Container>
				<Flex flex={1}>
					<Flex flex={1} />
					<HeaderActions />
				</Flex>
			</Flex>
		</Flex>
	);
};

export default Header;

const MobileQuestLog = () => {
	const [show, setShow] = useState(false);
	const [project] = useStore("current_project");

	useRouterEvents({
		onEnd: () => setShow(false),
	});

	if (!project) {
		return null;
	}

	return (
		<Flex hiddenFrom={"md"}>
			<Burger opened={show} onClick={() => setShow(true)} />
			<Drawer
				flex={1}
				bg={theme.colors.panel}
				onClose={() => setShow(false)}
				position={"left"}
				opened={show}
				style={{
					borderRight: "1px solid var(--mantine-color-dark-4)",
				}}
			>
				<QuestLog />
			</Drawer>
		</Flex>
	);
};
