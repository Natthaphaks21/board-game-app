const GAME_IMAGE_BY_NAME: Record<string, string> = {
  catan:
    "https://images.unsplash.com/photo-1632501641765-e568d28b0015?auto=format&fit=crop&w=160&q=80",
  "ticket to ride":
    "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=160&q=80",
  codenames:
    "https://images.unsplash.com/photo-1606503153255-59d8b8b5b7f9?auto=format&fit=crop&w=160&q=80",
  wingspan:
    "https://images.unsplash.com/photo-1585504198199-20277593b94f?auto=format&fit=crop&w=160&q=80",
  azul:
    "https://images.unsplash.com/photo-1606053896989-1ff2f7976db5?auto=format&fit=crop&w=160&q=80",
  pandemic:
    "https://images.unsplash.com/photo-1603732551658-5fabbafa84eb?auto=format&fit=crop&w=160&q=80",
  splendor:
    "https://images.unsplash.com/photo-1560179406-1c6c60e0dc76?auto=format&fit=crop&w=160&q=80",
  carcassonne:
    "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=160&q=80",
  werewolf:
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=160&q=80",
  insider:
    "https://images.unsplash.com/photo-1605870445919-838d190e8e1b?auto=format&fit=crop&w=160&q=80",
  dixit:
    "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=160&q=80",
  "exploding kittens":
    "https://images.unsplash.com/photo-1606503153255-59d8b8b5b7f9?auto=format&fit=crop&w=160&q=80",
  coup:
    "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=160&q=80",
}

export function getGameImageByName(name: string): string | null {
  const normalized = name.trim().toLowerCase()
  return GAME_IMAGE_BY_NAME[normalized] ?? null
}
