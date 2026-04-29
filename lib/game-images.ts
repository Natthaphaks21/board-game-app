const GAME_IMAGE_BY_NAME: Record<string, string> = {
  catan:
    "https://upload.wikimedia.org/wikipedia/en/a/a3/Catan-2015-boxart.jpg",
  "ticket to ride":
    "https://upload.wikimedia.org/wikipedia/en/9/92/Ticket_to_Ride_Board_Game_Box_EN.jpg",
  codenames:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Codenames_board_game.jpg/330px-Codenames_board_game.jpg",
  wingspan:
    "https://upload.wikimedia.org/wikipedia/en/c/c3/3d-wingspan-768x752.png",
  azul:
    "https://upload.wikimedia.org/wikipedia/en/2/23/Picture_of_Azul_game_box.jpg",
  pandemic:
    "https://upload.wikimedia.org/wikipedia/en/3/36/Pandemic_game.jpg",
  splendor:
    "https://upload.wikimedia.org/wikipedia/en/2/2e/BoardGameSplendorLogoFairUse.jpg",
  carcassonne:
    "https://upload.wikimedia.org/wikipedia/en/5/5e/Carcassonne-game.jpg",
  werewolf:
    "https://upload.wikimedia.org/wikipedia/en/thumb/f/f3/Ultimate_Werewold_board_game_cover_art_2017.png/330px-Ultimate_Werewold_board_game_cover_art_2017.png",
  insider:
    "https://oinkgames.com/images/flatview/insider_en_front.png",
  dixit:
    "https://upload.wikimedia.org/wikipedia/en/7/7b/Dixitgame.jpg",
  "exploding kittens":
    "https://upload.wikimedia.org/wikipedia/en/a/a6/Exploding_Kittens.png",
  coup:
    "https://indieboardsandcards.com/wp-content/uploads/2019/10/Untitled-design-4.png",
}

export function getGameImageByName(name: string): string | null {
  const normalized = name.trim().toLowerCase()
  return GAME_IMAGE_BY_NAME[normalized] ?? null
}
