const MATERIA_ID_ALIASES: Record<string, string> = {
  '84f6ff22-8ff6-43bf-811c-62e86e6202b5': 'd41eb18c-e8da-4a9c-a7d4-dee7873afaf1',
  'e15ec147-0b1e-4b56-8852-7332264d2512': '6680c3b6-c01b-49a7-bcf2-bf98bb51f34c',
  'bef82f55-85f5-41ef-97cb-c96d1689075f': '0da866f1-06d4-4113-83b4-c301d6b56cc7',
  '91cb451b-5f86-4f96-bb74-3c3ea040dc94': '58738dbb-ac9b-4b64-ba2d-a05245c4c25c',
  'a9c6f6db-beed-4776-bc12-1cd66215274c': 'd25d668c-c943-45bf-b195-5061f7e91b75',
};

export function resolveMateriaAlias(materiaId: string) {
  return MATERIA_ID_ALIASES[materiaId] ?? materiaId;
}

export function getCanonicalMateriaId(materiaId: string) {
  return resolveMateriaAlias(materiaId);
}
