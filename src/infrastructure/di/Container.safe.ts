// Container seguro para teste
export class Container {
  private static instance: Container;

  private constructor() {}

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  public getUserUseCase(): any {
    return {
      getCurrentUser: async () => {
        return { 
          id: "1", 
          name: "Usuário Teste", 
          email: "teste@teste.com",
          points: 1000,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      },
      login: async (credentials: any) => {
        console.log("Login mock:", credentials);
        return { 
          id: "1", 
          name: "Usuário Teste", 
          email: "teste@teste.com",
          points: 1000,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      },
      updateUserPoints: async (id: string, points: number) => {
        return { 
          id: "1", 
          name: "Usuário Teste", 
          email: "teste@teste.com",
          points: points,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
    };
  }

  public getRouletteUseCase(): any {
    return {
      getSectors: async () => {
        return [
          { id: "1", label: "Bitcoin", color: "#FF8C43", points: 100 },
          { id: "2", label: "Ethereum", color: "#7456C8", points: 50 },
          { id: "3", label: "Dólar", color: "#4CAF50", points: 200 }
        ];
      },
      playGame: async (userId: string, cost: number) => {
        const sectors = await this.getRouletteUseCase().getSectors();
        const randomSector = sectors[Math.floor(Math.random() * sectors.length)];
        return {
          result: {
            sector: randomSector,
            pointsWon: randomSector.points
          }
        };
      }
    };
  }

  public getArticleUseCase(): any {
    return {
      getArticles: async () => {
        return [
          {
            id: "1",
            title: "Bitcoin em alta",
            content: "Bitcoin subiu 10% hoje",
            imageUrl: "bitcoin",
            publishedAt: new Date()
          }
        ];
      }
    };
  }
}

