import GameResult from "./gameResult";
import {RankChangeType} from "../types/RankChangeType";

export type GameSummary = {
    result: GameResult;
    type: RankChangeType;
    lpDiff: number;
};