class Song {
    constructor({ username, genre, id, stars}) {
      this.username = username;
      this.genre = genre;
      this.id = id;
      this.stars = stars;
    }

    key() {
      return {
        PK: `USER#${this.username}`,
        SK: `GENRE#${this.genre}#SONG#${this.id}`,
      };
    }

    toItem() {
      return {
        ...this.key(),
        Type: "SONG",
        Stars: `USER#${this.username}#STARS#${this.stars}`
      };
    }
  }

  const songFromItem = (attributes) => {
    return new Song({
      username: attributes.PK.slice("USER#".length),
      genre: attributes.SK.split("#")[1],
      id: attributes.SK.split("#")[3],
      stars: Number(attributes.Stars.split("#").at(-1))
    });
  };

  export { Song, songFromItem };
