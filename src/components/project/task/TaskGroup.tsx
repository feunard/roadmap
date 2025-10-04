import {
	ActionIcon,
	Button,
	Flex,
	Stack,
	Text,
	UnstyledButton,
} from "@mantine/core";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import type { Task } from "../../../providers/Db.js";
import { openRenameZoneModal } from "./RenameZoneModal.jsx";
import TaskItem from "./TaskItem.jsx";

interface TaskGroupProps {
	name: string;
	tasks: Task[];
}

const TaskGroup = (props: TaskGroupProps) => {
	const [isCollapsed, setIsCollapsed] = useState(true);

	// sort by complexity
	const tasks = [...props.tasks].sort((a, b) =>
		a.complexity - b.complexity > 0 ? -1 : 1,
	);

	const handleRenameZone = (e: React.MouseEvent) => {
		e.stopPropagation();
		openRenameZoneModal(props.name);
	};

	return (
		<Stack gap={0}>
			<Flex p={0} align="center" justify="center" gap={"xs"}>
				<Flex align="center" justify="center">
					<ActionIcon
						size={"xs"}
						variant={"subtle"}
						onClick={() => setIsCollapsed(!isCollapsed)}
					>
						{isCollapsed ? <IconMinus size={10} /> : <IconPlus size={10} />}
					</ActionIcon>
					<Button
						px={"xs"}
						size={"xs"}
						variant={"subtle"}
						onClick={handleRenameZone}
					>
						<Text fw={"bold"}>{props.name}</Text>
					</Button>
				</Flex>
				<Flex flex={1} align="center" justify="center" px={2}>
					<Flex
						style={{
							height: 1,
							opacity: 0.2,
							width: "100%",
							backgroundColor: "var(--text-muted)",
						}}
					/>
				</Flex>
				<Flex>
					<Text c={"dimmed"} size="sm">
						{props.tasks.length} task{props.tasks.length > 1 ? "s" : ""}
					</Text>
				</Flex>
			</Flex>
			{isCollapsed && (
				<Stack gap={0}>
					{tasks.map((item) => (
						<TaskItem key={item.id} task={item} />
					))}
				</Stack>
			)}
		</Stack>
	);
};

export default TaskGroup;
