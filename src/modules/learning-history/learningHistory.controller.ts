import type { Request, Response } from "express";
import { LearningHistoryService } from "./learningHistory.service";

const learningHistoryService = new LearningHistoryService();

export const getHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
            return;
        }

        const search = req.query.search as string | undefined;
        const feature = req.query.feature as string | undefined;
        const dateRange = req.query.dateRange as string | undefined;
        const sort = req.query.sort as string | undefined;

        const parsedLimit = req.query.limit
            ? parseInt(req.query.limit as string, 10)
            : 50;

        const limit =
            Number.isFinite(parsedLimit) && parsedLimit > 0
                ? parsedLimit
                : 50;

        const history = await learningHistoryService.getLearningHistory(
            req.user.id,
            limit,
            {
                search,
                feature,
                dateRange,
                sort,
            }
        );

        res.status(200).json({
            success: true,
            data: history,
        });
    } catch (error) {
        console.error("Error in getHistory:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

//         const history = await learningHistoryService.getLearningHistory(req.user.id, limit, {
//             search,
//             feature,
//             dateRange,
//             sort,
//         });

//         res.status(200).json({ success: true, data: history });
//     } catch (error) {
//         console.error("Error in getHistory:", error);
//         res.status(500).json({ success: false, message: "Internal server error" });
//     }
// };

export const getSuggestions = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
            return;
        }

        const suggestions = await learningHistoryService.getPersonalizedSuggestions(
            req.user.id
        );

        res.status(200).json({
            success: true,
            data: suggestions,
        });
    } catch (error) {
        console.error("Error in getSuggestions:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
