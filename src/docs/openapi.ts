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
			name: "Settings",
			description: "Settings and account management endpoints.",
		},
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
		{
			name: "Notes",
			description: "Notes generation and management endpoints.",
		},
		{
			name: "Dashboard",
			description: "User dashboard and summary endpoints.",
		},
		{
			name: "Quiz Dashboard",
			description: "Quiz history and statistics endpoints.",
		},
		{
			name: "Profile",
			description: "User profile and avatar endpoints.",
		},
		{
			name: "Learning History",
			description: "User learning timeline and personalized study suggestions.",
		},
	],
	paths: {
		"/api/settings/delete-account": {
			delete: {
				tags: ["Settings"],
				summary: "Delete user account",
				description: "Permanently deletes the authenticated user's account and all associated data.",
				operationId: "deleteAccount",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["confirmationText"],
								properties: {
									confirmationText: {
										type: "string",
										description: "Must be exactly 'DELETE' to confirm.",
										example: "DELETE"
									}
								}
							}
						}
					}
				},
				responses: {
					"200": {
						description: "Account deleted successfully.",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										success: { type: "boolean", example: true },
										message: { type: "string", example: "Account deleted successfully" }
									}
								}
							}
						}
					},
					"400": {
						description: "Validation failed (e.g., incorrect confirmationText).",
					},
					"401": {
						description: "Unauthorized",
					}
				}
			}
		},
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
				description:
					"Uploads a document (PDF, DOCX, PPTX) for processing and RAG vector generation.",
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
		"/api/documents/{documentId}/download": {
			get: {
				tags: ["Documents"],
				summary: "Download a document",
				description: "Proxies the download of a document to bypass CORS restrictions.",
				operationId: "downloadDocument",
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
						description: "Successfully retrieved the document file.",
						content: {
							"application/octet-stream": {
								schema: {
									type: "string",
									format: "binary",
								},
							},
						},
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
				description:
					"Generates an educational explanation based on the highlighted text using the document context (RAG).",
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
				description:
					"Generates Basic, Intermediate, and Advanced interview questions based on the highlighted text using the document context (RAG).",
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
															a: { type: "string" },
														},
													},
												},
												intermediate: {
													type: "array",
													items: {
														type: "object",
														properties: {
															q: { type: "string" },
															a: { type: "string" },
														},
													},
												},
												advanced: {
													type: "array",
													items: {
														type: "object",
														properties: {
															q: { type: "string" },
															a: { type: "string" },
														},
													},
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
		"/api/workflow/quiz": {
			post: {
				tags: ["AI Workflows"],
				summary: "Generate AI Quiz",
				description:
					"Generates a comprehensive educational quiz (MCQs, True/False, and Short Answer) based on the highlighted text using the document context (RAG).",
				operationId: "generateQuiz",
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
						description: "Successfully generated the quiz.",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										success: { type: "boolean" },
										quiz: {
											type: "object",
											properties: {
												mcqs: {
													type: "array",
													items: {
														type: "object",
														properties: {
															question: { type: "string" },
															options: { type: "array", items: { type: "string" } },
															correctAnswer: { type: "string" },
														},
													},
												},
												trueFalse: {
													type: "array",
													items: {
														type: "object",
														properties: {
															question: { type: "string" },
															answer: { type: "boolean" },
														},
													},
												},
												shortAnswer: {
													type: "array",
													items: {
														type: "object",
														properties: {
															question: { type: "string" },
															expectedAnswer: { type: "string" },
														},
													},
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
		"/api/workflow/mindmap": {
			post: {
				tags: ["AI Workflows"],
				summary: "Generate AI Mind Map",
				description:
					"Generates a structured mind map based on highlighted text using the document context.",
				operationId: "generateMindMap",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["documentId", "highlightedText"],
								properties: {
									documentId: { type: "string" },
									highlightedText: { type: "string" },
								},
							},
						},
					},
				},
				responses: { "200": { description: "Successfully generated mind map." } },
			},
		},
		"/api/workflow/mindmap/explain": {
			post: {
				tags: ["AI Workflows"],
				summary: "Explain Mind Map",
				description: "Explains the logical flow of a previously generated mind map.",
				operationId: "explainMindMap",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["nodes", "edges"],
								properties: {
									nodes: { type: "array" },
									edges: { type: "array" },
								},
							},
						},
					},
				},
				responses: { "200": { description: "Successfully generated explanation." } },
			},
		},
		"/api/workflow/analogy": {
			post: {
				tags: ["AI Workflows"],
				summary: "Generate AI Analogy",
				description:
					"Generates an analogy for the highlighted text in a specific theme (gaming, story, education, real-world, sports, movie, eli10).",
				operationId: "generateAnalogy",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["documentId", "highlightedText", "style"],
								properties: {
									documentId: { type: "string" },
									highlightedText: { type: "string" },
									style: { type: "string" },
								},
							},
						},
					},
				},
				responses: { "200": { description: "Successfully generated analogy." } },
			},
		},
		"/api/workflow/simulation": {
			post: {
				tags: ["AI Workflows"],
				summary: "Generate AI Simulation",
				description:
					"Generates an educational simulation (visual-flow, step-by-step, or real-world) based on the highlighted text using the document context (RAG).",
				operationId: "generateSimulation",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["documentId", "highlightedText", "simulationType", "difficulty"],
								properties: {
									documentId: {
										type: "string",
										description: "The ID of the source document",
									},
									highlightedText: {
										type: "string",
										description: "The text highlighted by the user (max 5000 chars)",
									},
									simulationType: {
										type: "string",
										enum: ["visual-flow", "step-by-step", "real-world"],
										description: "The type of simulation to generate",
									},
									difficulty: {
										type: "string",
										enum: ["beginner", "intermediate", "advanced"],
										description: "The educational difficulty level",
									},
								},
							},
						},
					},
				},
				responses: {
					"200": {
						description: "Successfully generated the simulation.",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										success: { type: "boolean" },
										message: { type: "string" },
										simulation: {
											type: "object",
											properties: {
												id: { type: "string" },
												title: { type: "string" },
												simulationType: { type: "string" },
												difficulty: { type: "string" },
												overview: { type: "string" },
												entities: {
													type: "array",
													items: {
														type: "object",
														properties: {
															id: { type: "string" },
															label: { type: "string" },
															role: { type: "string" },
														},
													},
												},
												steps: {
													type: "array",
													items: {
														type: "object",
														properties: {
															stepNumber: { type: "integer" },
															title: { type: "string" },
															description: { type: "string" },
															activeEntities: {
																type: "array",
																items: { type: "string" },
															},
															explanation: { type: "string" },
														},
													},
												},
												summary: { type: "string" },
											},
										},
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
		"/api/workflow/notes": {
			post: {
				tags: ["Notes"],
				summary: "Generate AI Notes",
				description: "Generates study notes based on highlighted text using the document context.",
				operationId: "generateNotes",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["documentId", "highlightedText"],
								properties: {
									documentId: { type: "string" },
									highlightedText: { type: "string" },
								},
							},
						},
					},
				},
				responses: { "200": { description: "Successfully generated notes." } },
			},
			get: {
				tags: ["Notes"],
				summary: "Get All Notes",
				description: "Retrieves all saved notes for the authenticated user.",
				operationId: "getNotes",
				responses: { "200": { description: "Successfully retrieved notes." } },
			},
		},
		"/api/workflow/notes/{id}": {
			delete: {
				tags: ["Notes"],
				summary: "Delete a Note",
				description: "Deletes a specific note by ID.",
				operationId: "deleteNote",
				parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
				responses: { "200": { description: "Successfully deleted note." } },
			},
		},
		"/api/dashboard/summary": {
			get: {
				tags: ["Dashboard"],
				summary: "Get Dashboard Summary",
				description: "Retrieves summary statistics for the user dashboard.",
				operationId: "getDashboardSummary",
				responses: { "200": { description: "Successfully retrieved summary." } },
			},
		},
		"/api/quizzes": {
			get: {
				tags: ["Quiz Dashboard"],
				summary: "Get All Quizzes",
				description: "Retrieves all past quizzes for the user.",
				operationId: "getAllQuizzes",
				responses: { "200": { description: "Successfully retrieved quizzes." } },
			},
		},
		"/api/quizzes/recent": {
			get: {
				tags: ["Quiz Dashboard"],
				summary: "Get Recent Quizzes",
				description: "Retrieves the most recent quizzes for the user.",
				operationId: "getRecentQuizzes",
				responses: { "200": { description: "Successfully retrieved recent quizzes." } },
			},
		},
		"/api/quizzes/stats": {
			get: {
				tags: ["Quiz Dashboard"],
				summary: "Get Quiz Stats",
				description: "Retrieves aggregated quiz statistics for the user.",
				operationId: "getQuizStats",
				responses: { "200": { description: "Successfully retrieved quiz stats." } },
			},
		},
		"/api/quizzes/{quizId}": {
			get: {
				tags: ["Quiz Dashboard"],
				summary: "Get a specific Quiz",
				description: "Retrieves details of a specific quiz.",
				operationId: "getSingleQuiz",
				parameters: [{ name: "quizId", in: "path", required: true, schema: { type: "string" } }],
				responses: { "200": { description: "Successfully retrieved quiz." } },
			},
			delete: {
				tags: ["Quiz Dashboard"],
				summary: "Delete a Quiz",
				description: "Deletes a specific quiz.",
				operationId: "deleteQuiz",
				parameters: [{ name: "quizId", in: "path", required: true, schema: { type: "string" } }],
				responses: { "200": { description: "Successfully deleted quiz." } },
			},
		},
		"/api/profile": {
			get: {
				tags: ["Profile"],
				summary: "Get User Profile",
				description: "Retrieves the authenticated user's profile.",
				operationId: "getProfile",
				responses: { "200": { description: "Successfully retrieved profile." } },
			},
			patch: {
				tags: ["Profile"],
				summary: "Update User Profile",
				description: "Updates the authenticated user's profile (name, bio, learningGoals).",
				operationId: "updateProfile",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									name: { type: "string" },
									bio: { type: "string" },
									learningGoals: { type: "string" },
								},
							},
						},
					},
				},
				responses: { "200": { description: "Successfully updated profile." } },
			},
		},
		"/api/profile/stats": {
			get: {
				tags: ["Profile"],
				summary: "Get User Stats",
				description: "Retrieves user statistics.",
				operationId: "getProfileStats",
				responses: { "200": { description: "Successfully retrieved stats." } },
			},
		},
		"/api/profile/avatar": {
			post: {
				tags: ["Profile"],
				summary: "Upload Avatar",
				description: "Uploads a new avatar image for the user.",
				operationId: "uploadAvatar",
				requestBody: {
					required: true,
					content: {
						"multipart/form-data": {
							schema: {
								type: "object",
								properties: {
									avatar: { type: "string", format: "binary" },
								},
							},
						},
					},
				},
				responses: { "200": { description: "Successfully uploaded avatar." } },
			},
			delete: {
				tags: ["Profile"],
				summary: "Delete Avatar",
				description: "Deletes the user's avatar image.",
				operationId: "deleteAvatar",
				responses: { "200": { description: "Successfully deleted avatar." } },
			},
		},
		"/api/learning-history": {
			get: {
				tags: ["Learning History"],
				summary: "Get Learning History",
				description: "Retrieves a chronological timeline of the user's learning activities.",
				operationId: "getLearningHistory",
				responses: { "200": { description: "Successfully retrieved history." } }
			}
		},
		"/api/learning-history/suggestions": {
			get: {
				tags: ["Learning History"],
				summary: "Get Personalized Suggestions",
				description: "Generates AI-driven personalized study suggestions based on the user's learning history.",
				operationId: "getPersonalizedSuggestions",
				responses: { "200": { description: "Successfully generated suggestions." } }
			}
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
