import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

class RiotService {
  private baseUrl = "https://euw1.api.riotgames.com/lol";
  private apiKey = process.env.RIOT_API_KEY;

  getUrl(route = "") {
    return this.baseUrl + route + `?api_key=${this.apiKey}`;
  }
  async call(config: AxiosRequestConfig): Promise<AxiosResponse> {
    return axios(config);
  }

  async getSummonerByName(name: string): Promise<AxiosResponse> {
    const config = {
      url: this.getUrl(`/summoner/v4/summoners/by-name/${name}`),
      method: "GET",
    };
    return await this.call(config);
  }

  async getRank(summonerId: string): Promise<AxiosResponse> {
    const config = {
      url: this.getUrl(`/league/v4/entries/by-summoner/${summonerId}`),
      method: "GET",
    };
    return await this.call(config);
  }
}

export default RiotService;
