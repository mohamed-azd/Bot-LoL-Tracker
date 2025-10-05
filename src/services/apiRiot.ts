import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import env from "../config/env"

class RiotService {
  private baseUrl = "https://euw1.api.riotgames.com/lol";
  private baseUrlMatches = "https://europe.api.riotgames.com/lol";

  getUrl(route = "") {
    return this.baseUrl + route + `?api_key=${env.RIOT_API_KEY}`;
  }

  getMatchesUrl(route = "", firstArg = true) {
    const prefix = firstArg ? "?" : "&"
    return this.baseUrlMatches + route + `${prefix}api_key=${env.RIOT_API_KEY}`;
  }

  async call(config: AxiosRequestConfig): Promise<AxiosResponse> {
    return axios(config);
  }

  async getSummonerByPuuid(puuid: string): Promise<AxiosResponse> {
    const config = {
      url: this.getUrl(`/summoner/v4/summoners/by-puuid/${puuid}`),
      method: "GET",
    };
    return await this.call(config);
  }

  async getLastGameId(puuid: string) {
    const config = {
      url: this.getMatchesUrl(`/match/v5/matches/by-puuid/${puuid}/ids?queue=420&type=ranked&start=0&count=1`, false),
      method: "GET",
    };
    return await this.call(config);
  }

  async getGameInfos(matchId: string) {
    const config = {
      url: this.getMatchesUrl(`/match/v5/matches/${matchId}`),
      method: "GET",
    };
    return await this.call(config);
  }

  async getRank(summonerPuuid: string): Promise<AxiosResponse> {
    const config = {
      url: this.getUrl(`/league/v4/entries/by-puuid/${summonerPuuid}`),
      method: "GET",
    };
    return await this.call(config);
  }
}

export default RiotService;
