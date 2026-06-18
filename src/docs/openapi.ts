import { env } from "../config/env";

type OpenApiSchema = Record<string, unknown>;

interface OpenApiDocument {
	openapi: string;
	info: {
		title: string;
		description: string;
		version: string;
	};
	servers: Array<{
		url: string;
		description: string;
	}>;
	tags: Array<{
		name: string;
		description: string;
	}>;
	paths: Record<string, unknown>;
	components: {
		schemas: Record<string, OpenApiSchema>;
	};
}

export const openApiDocument: OpenApiDocument = {
	openapi: "3.1.0",
	info: {
		title: "AI Doubt Clarification API",
		description: "OpenAPI documentation for the backend API.",
		version: "1.0.0",
	},
	servers: [
		{
			url: env.BETTER_AUTH_URL,
			description: `${env.NODE_ENV} server`,
		},
	],
	tags: [
		{
			name: "Health",
			description: "Service and dependency health checks.",
		},
		{
			name: "Documents",
			description: "Document upload and management endpoints.",
		},
		{
			name: "AI Workflows",
			description: "AI generation and workflow endpoints.",
		},
	],
	paths: {
		"/api/health": {
			get: {
				tags: ["Health"],
				summary: "Get API health",
				description: "Returns application uptime, environment, and database status.",
				operationId: "getHealth",
				responses: {
					"200": {
						description: "Health check completed.",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/HealthResponse",
								},
							},
						},
					},
				},
			},
		},
		"/api/documents": {
			get: {
				tags: ["Documents"],
				summary: "List all documents",
				description: "Retrieves a list of all uploaded documents for the authenticated user.",
				operationId: "getDocuments",
				responses: {
					"200": {
						description: "Successfully retrieved documents.",
					},
					"401": {
						description: "Unauthorized",
					},
				},
			},
			post: {
				tags: ["Documents"],
				summary: "Upload a document",
				description: "Uploads a document (PDF, DOCX, PPTX) for processing and RAG vector generation.",
				operationId: "uploadDocument",
				requestBody: {
					required: true,
					content: {
						"multipart/form-data": {
							schema: {
								type: "object",
								properties: {
									file: {
										type: "string",
										format: "binary",
									},
								},
							},
						},
					},
				},
				responses: {
					"200": {
						description: "Successfully processed the document.",
					},
					"400": {
						description: "Bad Request. Missing file.",
					},
					"401": {
						description: "Unauthorized",
					},
				},
			},
		},
		"/api/documents/{documentId}": {
			get: {
				tags: ["Documents"],
				summary: "Get a specific document",
				description: "Retrieves details of a specific document by its ID.",
				operationId: "getDocumentById",
				parameters: [
					{
						name: "documentId",
						in: "path",
						required: true,
						schema: {
							type: "string",
						},
					},
				],
				responses: {
					"200": {
						description: "Successfully retrieved the document.",
					},
					"404": {
						description: "Document not found.",
					},
				},
			},
			delete: {
				tags: ["Documents"],
				summary: "Delete a document",
				description: "Deletes a document and all its associated vector chunks.",
				operationId: "deleteDocument",
				parameters: [
					{
						name: "documentId",
						in: "path",
						required: true,
						schema: {
							type: "string",
						},
					},
				],
				responses: {
					"200": {
						description: "Successfully deleted the document.",
					},
					"401": {
						description: "Unauthorized",
					},
					"404": {
						description: "Document not found.",
					},
				},
			},
		},
		"/api/workflow/explanation": {
			post: {
				tags: ["AI Workflows"],
				summary: "Generate AI Explanation",
				description: "Generates an educational explanation based on the highlighted text using the document context (RAG).",
				operationId: "generateExplanation",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["documentId", "highlightedText"],
								properties: {
									documentId: {
										type: "string",
										description: "The ID of the source document",
									},
									highlightedText: {
										type: "string",
										description: "The text highlighted by the user (max 5000 chars)",
									},
								},
							},
						},
					},
				},
				responses: {
					"200": {
						description: "Successfully generated the explanation.",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										success: { type: "boolean" },
										explanation: { type: "string" },
										retrievedChunks: { type: "integer" },
									},
								},
							},
						},
					},
					"400": {
						description: "Validation error on the request body.",
					},
					"401": {
						description: "Unauthorized",
					},
					"403": {
						description: "Unauthorized document access.",
					},
				},
			},
		},
		"/api/workflow/interview-questions": {
			post: {
				tags: ["AI Workflows"],
				summary: "Generate AI Interview Questions",
				description: "Generates Basic, Intermediate, and Advanced interview questions based on the highlighted text using the document context (RAG).",
				operationId: "generateInterviewQuestions",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["documentId", "highlightedText"],
								properties: {
									documentId: {
										type: "string",
										description: "The ID of the source document",
									},
									highlightedText: {
										type: "string",
										description: "The text highlighted by the user (max 5000 chars)",
									},
								},
							},
						},
					},
				},
				responses: {
					"200": {
						description: "Successfully generated the interview questions.",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										success: { type: "boolean" },
										questions: {
											type: "object",
											properties: {
												basic: { 
													type: "array", 
													items: { 
														type: "object",
														properties: {
															q: { type: "string" },
															a: { type: "string" }
														}
													} 
												},
												intermediate: { 
													type: "array", 
													items: { 
														type: "object",
														properties: {
															q: { type: "string" },
															a: { type: "string" }
														}
													} 
												},
												advanced: { 
													type: "array", 
													items: { 
														type: "object",
														properties: {
															q: { type: "string" },
															a: { type: "string" }
														}
													} 
												},
											},
										},
										retrievedChunks: { type: "integer" },
									},
								},
							},
						},
					},
					"400": {
						description: "Validation error on the request body.",
					},
					"401": {
						description: "Unauthorized",
					},
					"403": {
						description: "Unauthorized document access.",
					},
				},
			},
		},
	},
	components: {
		schemas: {
			HealthResponse: {
				type: "object",
				required: ["success", "status", "timestamp", "environment", "uptime", "services"],
				properties: {
					success: {
						type: "boolean",
						examples: [true],
					},
					status: {
						type: "string",
						enum: ["healthy", "degraded"],
					},
					timestamp: {
						type: "string",
						format: "date-time",
					},
					environment: {
						type: "string",
						enum: ["development", "production", "test"],
					},
					uptime: {
						type: "integer",
						minimum: 0,
					},
					services: {
						type: "object",
						required: ["database"],
						properties: {
							database: {
								type: "string",
								enum: ["healthy", "unhealthy"],
							},
						},
					},
				},
			},
			ErrorResponse: {
				type: "object",
				required: ["success", "message"],
				properties: {
					success: {
						type: "boolean",
						examples: [false],
					},
					message: {
						type: "string",
					},
				},
			},
		},
	},
};
