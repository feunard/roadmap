import { AreaChart, BarChart, DonutChart } from "@mantine/charts";
import {
	Badge,
	Card,
	Flex,
	Grid,
	Group,
	SimpleGrid,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
	IconChartBar,
	IconDownload,
	IconStar,
	IconTarget,
	IconTrendingUp,
	IconTrophy,
	IconUsers,
} from "@tabler/icons-react";
import { useAlepha, useClient } from "alepha/react";
import type { ProjectStatsApi } from "../../api/ProjectStatsApi.js";
import Action from "../ui/Action.jsx";

export interface ProjectStatsProps {
	stats: {
		overview: {
			totalTasks: number;
			completedTasks: number;
			activePlayers: number;
			totalXP: number;
			averageTaskComplexity: number;
		};
		tasksByPriority: Array<{
			priority: string;
			count: number;
			completed: number;
		}>;
		tasksByComplexity: Array<{
			complexity: number;
			count: number;
			averageXP: number;
		}>;
		topZones: Array<{
			zone: string;
			totalTasks: number;
			completedTasks: number;
			completionRate: number;
		}>;
		activityTimeline: Array<{
			date: string;
			tasksCompleted: number;
		}>;
		completionRate: {
			weekly: number;
			monthly: number;
			overall: number;
		};
	};
}

const ProjectStats = (props: ProjectStatsProps) => {
	const { stats } = props;
	const alepha = useAlepha();
	const projectStatsApi = useClient<ProjectStatsApi>();
	const currentProject = alepha.state.get("current_project");

	const handleExportCsv = async () => {
		if (!currentProject) {
			notifications.show({
				title: "Error",
				message: "No project selected",
				color: "red",
			});
			return;
		}

		try {
			const csvData = await projectStatsApi.exportTasksCsv({
				params: { id: currentProject.id },
			});

			// Create blob and download
			const url = window.URL.createObjectURL(
				new Blob([await csvData.text()], { type: "text/csv" }),
			);
			const a = document.createElement("a");
			a.href = url;
			a.download = csvData.name;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);

			notifications.show({
				title: "Success",
				message: "Tasks exported to CSV successfully",
				color: "green",
			});
		} catch (error: any) {
			notifications.show({
				title: "Export Failed",
				message: error?.message || "Failed to export tasks",
				color: "red",
			});
		}
	};

	// Prepare data for charts
	const priorityData = stats.tasksByPriority.map((item) => ({
		priority: item.priority.charAt(0).toUpperCase() + item.priority.slice(1),
		total: item.count,
		completed: item.completed,
		remaining: item.count - item.completed,
	}));

	const complexityData = stats.tasksByComplexity.map((item) => ({
		complexity: `Level ${item.complexity}`,
		count: item.count,
		averageXP: item.averageXP,
	}));

	const zonesData = stats.topZones.map((zone) => ({
		zone:
			zone.zone.length > 15 ? `${zone.zone.substring(0, 15)}...` : zone.zone,
		fullZone: zone.zone,
		totalTasks: zone.totalTasks,
		completedTasks: zone.completedTasks,
		completionRate: zone.completionRate,
	}));

	const timelineData = stats.activityTimeline.map((item) => ({
		date: new Date(item.date).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		}),
		tasks: item.tasksCompleted,
	}));

	const completionDonutData = [
		{
			name: "Completed",
			value: stats.overview.completedTasks,
			color: "green.6",
		},
		{
			name: "Remaining",
			value: stats.overview.totalTasks - stats.overview.completedTasks,
			color: "gray.4",
		},
	];

	return (
		<Flex flex={1} p="lg" className={"overflow-auto"}>
			<Stack w="100%" maw={1200}>
				<Group justify="space-between" align="center">
					<Group gap="sm" align="center">
						<IconChartBar size={24} />
						<Title order={2}>Project Analytics</Title>
					</Group>
					<Action
						variant="light"
						leftSection={<IconDownload size={16} />}
						onClick={handleExportCsv}
						size="sm"
					>
						Export CSV
					</Action>
				</Group>

				<Text c="dimmed" size="sm">
					Comprehensive insights into project progress and team performance
				</Text>

				{/* Overview Cards */}
				<SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
					<Card
						shadow="sm"
						padding="lg"
						radius="md"
						withBorder
						bg={"var(--card-bg-color)"}
					>
						<Group gap="sm">
							<IconTarget size={20} color="var(--mantine-color-blue-6)" />
							<Stack gap={0} flex={1}>
								<Text size="xl" fw={700}>
									{stats.overview.totalTasks}
								</Text>
								<Text size="sm" c="dimmed">
									Total Tasks
								</Text>
							</Stack>
						</Group>
					</Card>

					<Card
						shadow="sm"
						padding="lg"
						radius="md"
						withBorder
						bg={"var(--card-bg-color)"}
					>
						<Group gap="sm">
							<IconTrophy size={20} color="var(--mantine-color-green-6)" />
							<Stack gap={0} flex={1}>
								<Text size="xl" fw={700}>
									{stats.overview.completedTasks}
								</Text>
								<Text size="sm" c="dimmed">
									Completed
								</Text>
							</Stack>
						</Group>
					</Card>

					<Card
						shadow="sm"
						padding="lg"
						radius="md"
						withBorder
						bg={"var(--card-bg-color)"}
					>
						<Group gap="sm">
							<IconUsers size={20} color="var(--mantine-color-purple-6)" />
							<Stack gap={0} flex={1}>
								<Text size="xl" fw={700}>
									{stats.overview.activePlayers}
								</Text>
								<Text size="sm" c="dimmed">
									Active Players
								</Text>
							</Stack>
						</Group>
					</Card>

					<Card
						shadow="sm"
						padding="lg"
						radius="md"
						withBorder
						bg={"var(--card-bg-color)"}
					>
						<Group gap="sm">
							<IconStar size={20} color="var(--mantine-color-yellow-6)" />
							<Stack gap={0} flex={1}>
								<Text size="xl" fw={700}>
									{stats.overview.totalXP.toLocaleString()}
								</Text>
								<Text size="sm" c="dimmed">
									Total XP
								</Text>
							</Stack>
						</Group>
					</Card>
				</SimpleGrid>

				<Grid>
					{/* Completion Progress */}
					<Grid.Col span={{ base: 12, md: 6 }}>
						<Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
							<Stack gap="md">
								<Title order={4}>Task Completion</Title>
								{stats.overview.totalTasks > 0 ? (
									<>
										<DonutChart
											data={completionDonutData}
											thickness={30}
											size={160}
											withLabels
											withTooltip
											tooltipDataSource="segment"
										/>
										<Stack gap="xs">
											<Group justify="space-between">
												<Text size="sm">Overall Progress</Text>
												<Text size="sm" fw={500}>
													{stats.completionRate.overall.toFixed(1)}%
												</Text>
											</Group>
											<Group justify="space-between">
												<Text size="sm">This Week</Text>
												<Text size="sm" fw={500}>
													{stats.completionRate.weekly} tasks
												</Text>
											</Group>
											<Group justify="space-between">
												<Text size="sm">This Month</Text>
												<Text size="sm" fw={500}>
													{stats.completionRate.monthly} tasks
												</Text>
											</Group>
										</Stack>
									</>
								) : (
									<Text c="dimmed" ta="center" py="xl">
										No tasks yet
									</Text>
								)}
							</Stack>
						</Card>
					</Grid.Col>

					{/* Tasks by Priority */}
					<Grid.Col span={{ base: 12, md: 6 }}>
						<Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
							<Stack gap="md">
								<Title order={4}>Tasks by Priority</Title>
								{priorityData.length > 0 ? (
									<BarChart
										h={200}
										data={priorityData}
										dataKey="priority"
										series={[
											{ name: "completed", color: "green.6" },
											{ name: "remaining", color: "gray.4" },
										]}
										tickLine="xy"
										withTooltip
									/>
								) : (
									<Text c="dimmed" ta="center" py="xl">
										No data available
									</Text>
								)}
							</Stack>
						</Card>
					</Grid.Col>

					{/* Activity Timeline */}
					<Grid.Col span={12}>
						<Card shadow="sm" padding="lg" radius="md" withBorder>
							<Stack gap="md">
								<Group gap="sm">
									<IconTrendingUp size={20} />
									<Title order={4}>Activity Timeline (Last 14 Days)</Title>
								</Group>
								{timelineData.length > 0 ? (
									<AreaChart
										h={250}
										data={timelineData}
										dataKey="date"
										series={[
											{
												name: "tasks",
												label: "Tasks Completed",
												color: "blue.6",
											},
										]}
										curveType="monotone"
										withGradient
										withTooltip
									/>
								) : (
									<Text c="dimmed" ta="center" py="xl">
										No recent activity
									</Text>
								)}
							</Stack>
						</Card>
					</Grid.Col>

					{/* Top Zones */}
					<Grid.Col span={12}>
						<Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
							<Stack gap="md">
								<Title order={4}>Top Zones</Title>
								{zonesData.length > 0 ? (
									<BarChart
										h={200}
										data={zonesData}
										dataKey="zone"
										series={[
											{
												name: "completedTasks",
												label: "Completed",
												color: "green.6",
											},
											{
												name: "totalTasks",
												label: "Total",
												color: "blue.6",
											},
										]}
										withTooltip
									/>
								) : (
									<Text c="dimmed" ta="center" py="xl">
										No zones yet
									</Text>
								)}
							</Stack>
						</Card>
					</Grid.Col>

					{/* Task Complexity Distribution */}
					<Grid.Col span={{ base: 12, md: 6 }}>
						<Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
							<Stack gap="md">
								<Title order={4}>Task Complexity</Title>
								{complexityData.length > 0 ? (
									<BarChart
										h={200}
										data={complexityData}
										dataKey="complexity"
										series={[
											{ name: "count", label: "Task Count", color: "indigo.6" },
										]}
										withTooltip
									/>
								) : (
									<Text c="dimmed" ta="center" py="xl">
										No data available
									</Text>
								)}
							</Stack>
						</Card>
					</Grid.Col>
				</Grid>
			</Stack>
		</Flex>
	);
};

export default ProjectStats;
