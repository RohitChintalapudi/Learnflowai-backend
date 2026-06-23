export interface SimulationEntity {
	id: string;
	label: string;
	role: string;
}

export interface SimulationStep {
	stepNumber: number;
	title: string;
	description: string;
	activeEntities: string[];
	explanation: string;
}

export interface SimulationOutput {
	title: string;
	simulationType: string;
	difficulty: string;
	overview: string;
	entities: SimulationEntity[];
	steps: SimulationStep[];
	summary: string;
}

export interface SimulationResponse {
	success: boolean;
	message: string;
	simulation?: SimulationOutput & { id: string };
}
