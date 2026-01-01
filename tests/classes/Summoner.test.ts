import Summoner from "../../src/classes/Summoner";
import RiotService from "../../src/services/apiRiot";
import GameResult from "../../src/types/gameResult";
import Tier from "../../src/types/tier";
import {RankChangeType} from "../../src/types/RankChangeType";

jest.mock("../../src/services/apiRiot");

describe("Summoner Logic", () => {
    let summoner: Summoner;
    let mockRiotService: jest.Mocked<RiotService>;

    beforeEach(() => {
        jest.clearAllMocks();
        summoner = new Summoner("TestUser", "test-puuid", "123456789");
        mockRiotService = (RiotService as unknown as jest.Mock).mock.instances[0];
    });

    const setupMocks = (
        tier: string,
        rank: string,
        lp: number,
        lastGameId: string,
        win: boolean = true
    ) => {
        (RiotService.prototype.getSummonerByPuuid as jest.Mock).mockResolvedValue({
            data: {puuid: "test-puuid", name: "TestUser"}
        });

        (RiotService.prototype.getLastGameId as jest.Mock).mockResolvedValue({
            data: [lastGameId]
        });

        (RiotService.prototype.getRank as jest.Mock).mockResolvedValue({
            data: [{
                queueType: "RANKED_SOLO_5x5",
                tier: tier,
                rank: rank,
                leaguePoints: lp
            }]
        });

        (RiotService.prototype.getGameInfos as jest.Mock).mockResolvedValue({
            data: {
                info: {
                    gameDuration: 1800,
                    participants: [{
                        puuid: "test-puuid",
                        championName: "Ahri",
                        kills: 5,
                        deaths: 2,
                        assists: 10,
                        win: win,
                        riotIdGameName: "TestUser",
                        riotIdTagline: "EUW"
                    }]
                }
            }
        });
    };

    test("should load initial data correctly", async () => {
        setupMocks("GOLD", "IV", 50, "EUW1_123456");

        await summoner.loadData();

        expect(summoner.getTier()).toBe(Tier.GOLD);
        expect(summoner.getRank()).toBe("IV");
        expect(summoner.getLp()).toBe(50);
    });

    test("should detect LP gain (Victory)", async () => {
        // 1. Initial State: Gold IV 50 LP
        setupMocks("GOLD", "IV", 50, "EUW1_123456");
        await summoner.loadData();

        // 2. New State: Gold IV 70 LP (Won a game)
        setupMocks("GOLD", "IV", 70, "EUW1_123457", true);

        const result = await summoner.check();

        expect(result).not.toBeNull();
        expect(summoner.getLp()).toBe(70);
    });

    test("should detect LP loss (Defeat)", async () => {
        // 1. Initial State
        setupMocks("GOLD", "IV", 50, "EUW1_123456");
        await summoner.loadData();

        // 2. New State: Gold IV 30 LP (Lost a game)
        setupMocks("GOLD", "IV", 30, "EUW1_123457", false);

        const result = await summoner.check();
        expect(result).not.toBeNull();
        expect(summoner.getLp()).toBe(30);
    });

    test("should detect Rank Promotion", async () => {
        setupMocks("GOLD", "IV", 90, "EUW1_1");
        await summoner.loadData();
        setupMocks("GOLD", "III", 10, "EUW1_2", true); // +20 LP diff

        const result = await summoner.check();
        expect(result).not.toBeNull();
        expect(summoner.getRank()).toBe("III");
    });

    test("should detect Rank Demotion", async () => {
        setupMocks("GOLD", "III", 0, "EUW1_1");
        await summoner.loadData();
        setupMocks("GOLD", "IV", 75, "EUW1_2", false); // -25 LP diff

        const result = await summoner.check();
        expect(result).not.toBeNull();
        expect(summoner.getRank()).toBe("IV");
    });

    test("should detect Tier Promotion", async () => {
        setupMocks("GOLD", "I", 90, "EUW1_1");
        await summoner.loadData();
        setupMocks("PLATINUM", "IV", 10, "EUW1_2", true); // +20 LP diff

        const result = await summoner.check();
        expect(result).not.toBeNull();
        expect(summoner.getTier()).toBe(Tier.PLATINUM);
    });

    test("should return null if no new game detected", async () => {
        setupMocks("GOLD", "IV", 50, "EUW1_1");
        await summoner.loadData();
        setupMocks("GOLD", "IV", 50, "EUW1_1");

        const result = await summoner.check();
        expect(result).toBeNull();
    });

    test("compareTotalRank logic directly", () => {
        // Init: GOLD IV 50 LP
        // @ts-ignore
        summoner.tier = Tier.GOLD; summoner.rank = "IV"; summoner.lp = 50;

        // LP Gain
        let res = summoner.compareTotalRank(Tier.GOLD, "IV", 30);
        expect(res.result).toBe(GameResult.VICTORY);
        expect(res.lpDiff).toBe(20);

        // LP Loss
        res = summoner.compareTotalRank(Tier.GOLD, "IV", 70);
        expect(res.result).toBe(GameResult.DEFEAT);
        expect(res.lpDiff).toBe(-20);

        // Rank Promotion: IV 90 -> III 20 (+30 LP)
        // @ts-ignore
        summoner.rank = "III"; summoner.lp = 20;
        res = summoner.compareTotalRank(Tier.GOLD, "IV", 90);
        expect(res.result).toBe(GameResult.VICTORY);
        expect(res.type).toBe(RankChangeType.RANK);
        expect(res.lpDiff).toBe(30);

        // Rank Demotion: III 0 -> IV 80 (-20 LP)
        // @ts-ignore
        summoner.rank = "IV"; summoner.lp = 80;
        res = summoner.compareTotalRank(Tier.GOLD, "III", 0);
        expect(res.result).toBe(GameResult.DEFEAT);
        expect(res.type).toBe(RankChangeType.RANK);
        expect(res.lpDiff).toBe(-20);

        // Tier Promotion: SILVER I 90 -> GOLD IV 10 (+20 LP)
        // @ts-ignore
        summoner.tier = Tier.GOLD; summoner.rank = "IV"; summoner.lp = 10;
        res = summoner.compareTotalRank(Tier.SILVER, "I", 90);
        expect(res.result).toBe(GameResult.VICTORY);
        expect(res.type).toBe(RankChangeType.TIER);
        expect(res.lpDiff).toBe(20);
    });
});