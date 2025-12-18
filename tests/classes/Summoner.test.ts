import Summoner from "../../src/classes/Summoner";
import RiotService from "../../src/services/apiRiot";
import GameResult from "../../src/types/gameResult";
import Tier from "../../src/types/tier";

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
      data: { puuid: "test-puuid", name: "TestUser" }
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

    const success = await summoner.loadData();

    expect(success).toBe(true);
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

    expect(result).not.toBe(false);
    expect(summoner.getLp()).toBe(70);
  });

  test("should detect LP loss (Defeat)", async () => {
    // 1. Initial State
    setupMocks("GOLD", "IV", 50, "EUW1_123456");
    await summoner.loadData();

    // 2. New State: Gold IV 30 LP (Lost a game)
    setupMocks("GOLD", "IV", 30, "EUW1_123457", false);

    const result = await summoner.check();
    expect(result).not.toBe(false);
    expect(summoner.getLp()).toBe(30);
  });

  test("should detect Rank Promotion", async () => {
    // 1. Initial State: Gold IV 90 LP
    setupMocks("GOLD", "IV", 90, "EUW1_123456");
    await summoner.loadData();

    // 2. New State: Gold III 10 LP
    setupMocks("GOLD", "III", 10, "EUW1_123457", true);

    const result = await summoner.check();
    expect(result).not.toBe(false);
    expect(summoner.getRank()).toBe("III");
  });

  test("should detect Rank Demotion", async () => {
    // 1. Initial State: Gold III 0 LP
    setupMocks("GOLD", "III", 0, "EUW1_123456");
    await summoner.loadData();

    // 2. New State: Gold IV 75 LP
    setupMocks("GOLD", "IV", 75, "EUW1_123457", false);

    const result = await summoner.check();
    expect(result).not.toBe(false);
    expect(summoner.getRank()).toBe("IV");
  });

  test("should detect Tier Promotion", async () => {
    // 1. Initial State: Gold I 90 LP
    setupMocks("GOLD", "I", 90, "EUW1_123456");
    await summoner.loadData();

    // 2. New State: Platinum IV 1 LP
    setupMocks("PLATINUM", "IV", 1, "EUW1_123457", true);

    const result = await summoner.check();
    expect(result).not.toBe(false);
    expect(summoner.getTier()).toBe(Tier.PLATINUM);
  });

  test("should return false if no new game detected", async () => {
    // 1. Initial State
    setupMocks("GOLD", "IV", 50, "EUW1_123456");
    await summoner.loadData();

    // 2. Same State (Same Game ID)
    setupMocks("GOLD", "IV", 50, "EUW1_123456");

    const result = await summoner.check();
    expect(result).toBe(false);
  });
  
  test("compareTotalRank logic directly", () => {
      // Setup initial state manually
      // @ts-ignore
      summoner.tier = Tier.GOLD;
      // @ts-ignore
      summoner.rank = "IV";
      // @ts-ignore
      summoner.lp = 50;
      
      // Test Victory
      let res = summoner.compareTotalRank(Tier.GOLD, "IV", 30); // Old was 30, now 50
      expect(res.result).toBe(GameResult.VICTORY);
      expect(res.value).toBe(20);

      // Test Defeat
      res = summoner.compareTotalRank(Tier.GOLD, "IV", 70); // Old was 70, now 50
      expect(res.result).toBe(GameResult.DEFEAT);
      expect(res.value).toBe(20);

      // Test Promotion
      // @ts-ignore
      summoner.rank = "III"; 
      res = summoner.compareTotalRank(Tier.GOLD, "IV", 90); // Old was IV, now III
      expect(res.result).toBe(GameResult.VICTORY);
      expect(res.type).toBe("RANK");
      
      // Test Demotion
      // @ts-ignore
      summoner.rank = "IV";
      res = summoner.compareTotalRank(Tier.GOLD, "III", 0); // Old was III, now IV
      expect(res.result).toBe(GameResult.DEFEAT);
      expect(res.type).toBe("RANK");
  });
});