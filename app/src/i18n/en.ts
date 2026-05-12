// English strings — default language.
// Keys are dot-namespaced. Keep them stable; values are free to evolve.

export type Dict = {
  common: Record<
    | 'cancel' | 'save' | 'delete' | 'edit' | 'back' | 'close'
    | 'create' | 'add' | 'loading' | 'confirm' | 'yes' | 'no'
    | 'retry' | 'select' | 'optional',
    string
  >;
  app: Record<'name', string>;
  language: Record<'label' | 'en' | 'fr', string>;
  home: {
    overline: string;
    description1: string;
    description2: string;
    create: { title: string; subtitle: string; cta: string };
    join: { title: string; subtitle: string; cta: string };
    footer: { reportBug: string; supportKofi: string };
  };
  spaceCreated: Record<
    | 'overline' | 'title' | 'nameLabel' | 'loginCodeLabel' | 'copyCode'
    | 'copied' | 'warningTitle' | 'warningText' | 'gotIt',
    string
  >;
  header: Record<'home' | 'space' | 'copyInvite' | 'inviteCopied' | 'inviteCodeCopied' | 'leave', string>;
  createSpace: Record<
    | 'overline' | 'title' | 'nameLabel' | 'namePlaceholder'
    | 'passwordLabel' | 'passwordPlaceholder' | 'submit' | 'submitting'
    | 'errorRequired' | 'errorGeneric',
    string
  >;
  joinSpace: Record<
    | 'overline' | 'title' | 'codeLabel' | 'codePlaceholder'
    | 'passwordLabel' | 'passwordPlaceholder' | 'submit' | 'submitting'
    | 'errorRequired' | 'errorInvalid' | 'errorWrongPassword' | 'errorGeneric',
    string
  >;
  dashboard: Record<
    | 'countOne' | 'countOther' | 'inviteCode' | 'addCharacter' | 'graphView'
    | 'manageLocations' | 'manageLocationsTitle' | 'searchPlaceholder'
    | 'typeAll' | 'typePC' | 'typeNPC'
    | 'locationsLabel' | 'allLocations' | 'noLocation'
    | 'emptySearch' | 'emptyAll',
    string
  >;
  character: Record<
    | 'sheetOverline' | 'notFound' | 'backToGrimoire' | 'delete' | 'deleteConfirm'
    | 'typePC' | 'typeNPC' | 'typePCFull' | 'typeNPCFull'
    | 'informations' | 'role' | 'type' | 'location'
    | 'rolePlaceholder' | 'locationPlaceholder'
    | 'tags' | 'tagPlaceholder'
    | 'traits' | 'noTrait' | 'newTrait'
    | 'notes' | 'noteEditorPlaceholder'
    | 'relations' | 'noRelation' | 'addRelation' | 'pickCharacter' | 'detailPlaceholder'
    | 'editRelation' | 'deleteRelation' | 'deleteRelationConfirm'
    | 'relationPrecisionPlaceholder' | 'save'
    | 'relationCountOne' | 'relationCountOther',
    string
  >;

  characterForm: Record<
    | 'overline' | 'title' | 'nameLabel' | 'namePlaceholder'
    | 'typeLabel' | 'roleLabel' | 'rolePlaceholder'
    | 'locationLabel' | 'locationPlaceholder'
    | 'tagsLabel' | 'tagsPlaceholder'
    | 'traitsLabel' | 'traitsPlaceholder'
    | 'notesLabel' | 'notesPlaceholder'
    | 'submit' | 'submitting',
    string
  >;
  locations: Record<
    | 'overline' | 'title' | 'empty' | 'nplaceholderShort'
    | 'addOverline' | 'addPlaceholder'
    | 'create' | 'rename' | 'delete' | 'cancel' | 'save'
    | 'pickerPlaceholder' | 'pickerNone' | 'pickerCreateNew'
    | 'customColor' | 'pickColor' | 'createAndSelect'
    | 'deleteConfirm' | 'deleteConfirmWithChars' | 'deleted' | 'countLabel',
    string
  >;
  graph: Record<
    | 'overline' | 'title' | 'closePanel' | 'openPanel' | 'filters'
    | 'summary' | 'summaryRels' | 'error' | 'empty' | 'searchPlaceholder'
    | 'visibleCount'
    | 'sectionLocations' | 'sectionType' | 'sectionRelationTypes' | 'sectionForces'
    | 'selectAll' | 'selectNone' | 'noLocation' | 'noLocationDefined'
    | 'typePC' | 'typeNPC'
    | 'centerForce' | 'repelForce' | 'linkForce' | 'linkDistance'
    | 'freeze' | 'resume' | 'reorganize'
    | 'legendNode' | 'legendText',
    string
  >;
  relation: Record<
    | 'friend' | 'family' | 'mentor' | 'companion' | 'rival' | 'enemy'
    | 'romance' | 'acquaintance' | 'other'
    | 'closeFriend' | 'distrust' | 'swornEnemy' | 'ally',
    string
  >;
  errors: Record<'boundaryTitle' | 'boundaryDefault', string>;
};

export const en: Dict = {
  common: {
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    close: 'Close',
    create: 'Create',
    add: 'Add',
    loading: 'Loading…',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    retry: 'Retry',
    select: 'Select',
    optional: 'optional',
  },

  app: {
    name: 'Ink & Stone',
  },

  language: {
    label: 'Language',
    en: 'EN',
    fr: 'FR',
  },

  home: {
    overline: 'Shared wiki · No account needed',
    description1:
      'A simple character manager for your tabletop RPG sessions. Characters, traits, alliances — shared instantly with your players from any device.',
    description2:
      'Built for my Stonetop and Vampire table. Works for any setting.',
    create: {
      title: 'Create a shared grimoire',
      subtitle: 'Start a new shared grimoire',
      cta: 'Open the grimoire',
    },
    join: {
      title: 'Join an existing grimoire',
      subtitle: 'Connect to a grimoire',
      cta: 'Turn the page',
    },
    footer: {
      reportBug: 'Report a bug or suggest a feature',
      supportKofi: 'Support the project on Ko-fi',
    },
  },

  spaceCreated: {
    overline: 'Success',
    title: 'Grimoire created!',
    nameLabel: 'Name',
    loginCodeLabel: 'Login code',
    copyCode: 'Copy',
    copied: 'Copied!',
    warningTitle: 'IMPORTANT',
    warningText: 'Keep this code! You and your players will need it to reconnect. You\'ll also find it below your grimoire\'s title.',
    gotIt: 'Got it',
  },

  header: {
    home: 'Ink & Stone — home',
    space: 'Space',
    copyInvite: 'Copy invite link',
    inviteCopied: 'Invite link copied',
    inviteCodeCopied: 'Login code copied',
    leave: 'Leave this space',
  },

  createSpace: {
    overline: 'New space',
    title: 'Open a grimoire',
    nameLabel: 'Group name',
    namePlaceholder: 'The Heroes of Stonetop',
    passwordLabel: 'Password',
    passwordPlaceholder: 'A password to share with your players',
    submit: 'Create and enter',
    submitting: 'Creating…',
    errorRequired: 'All fields are required',
    errorGeneric: 'Something went wrong',
  },

  joinSpace: {
    overline: 'Join a space',
    title: 'Open the pages',
    codeLabel: 'Invite code or URL',
    codePlaceholder: 'e.g. gg-bdz',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Group password',
    submit: 'Enter the grimoire',
    submitting: 'Connecting…',
    errorRequired: 'All fields are required',
    errorInvalid: 'Invalid invite code',
    errorWrongPassword: 'Wrong password',
    errorGeneric: 'Something went wrong',
  },

  dashboard: {
    countOne: '{n} character',
    countOther: '{n} characters',
    inviteCode: 'Login code',
    addCharacter: 'Add character',
    graphView: 'Graph view',
    manageLocations: 'Manage locations',
    manageLocationsTitle: 'Manage the list of locations',
    searchPlaceholder: 'Search by name, role, location, trait, tag…',
    typeAll: 'all',
    typePC: 'PC',
    typeNPC: 'NPC',
    locationsLabel: 'Locations',
    allLocations: 'All',
    noLocation: 'No location',
    emptySearch: 'No character matches your search.',
    emptyAll: 'The grimoire is empty. Add the first character.',
  },

  character: {
    sheetOverline: 'Character sheet',
    notFound: 'Character not found…',
    backToGrimoire: 'Back to the grimoire',
    delete: 'Delete',
    deleteConfirm: 'Permanently delete this character?',
    typePC: 'PC',
    typeNPC: 'NPC',
    typePCFull: 'Player Character',
    typeNPCFull: 'Non-Player Character',
    informations: 'Information',
    role: 'Role',
    type: 'Type',
    location: 'Location',
    rolePlaceholder: 'e.g. Smith, Innkeeper…',
    locationPlaceholder: 'No location / pick one…',
    tags: 'Tags / Categories',
    tagPlaceholder: '+ tag',
    traits: 'Traits',
    noTrait: 'No trait yet.',
    newTrait: 'New trait…',
    notes: 'Description / Notes',
    noteEditorPlaceholder: 'Write your notes here…',
    relations: 'Relations',
    noRelation: 'No relation yet for this character.',
    addRelation: 'Add a relation',
    pickCharacter: 'Pick a character…',
    detailPlaceholder: 'Detail (optional) — e.g. "son of", "childhood friend"',
    editRelation: 'Edit relation',
    deleteRelation: 'Delete relation',
    deleteRelationConfirm: 'Delete this relation?',
    relationPrecisionPlaceholder: 'Detail (e.g. "son of", "cousin"…)',
    relationCountOne: '{n} relation',
    relationCountOther: '{n} relations',
    save: 'Save',
  },


  characterForm: {
    overline: 'New character',
    title: 'Add to the grimoire',
    nameLabel: 'Name',
    namePlaceholder: 'e.g. Bryn',
    typeLabel: 'Type',
    roleLabel: 'Role / Occupation',
    rolePlaceholder: 'e.g. Smith',
    locationLabel: 'Location',
    locationPlaceholder: 'No location / pick one…',
    tagsLabel: 'Tags / Categories',
    tagsPlaceholder: 'Faction, Family name, Ethnicity…',
    traitsLabel: 'Traits',
    traitsPlaceholder: 'Strong, Stubborn, Loyal…',
    notesLabel: 'Notes',
    notesPlaceholder: 'Description, anecdotes, secrets…',
    submit: 'Create character',
    submitting: 'Creating…',
  },

  locations: {
    overline: 'World map',
    title: 'Manage locations',
    empty: 'No location yet. Create one below.',
    nplaceholderShort: 'Location name',
    addOverline: 'Add a location',
    addPlaceholder: 'Location name',
    create: 'Create',
    rename: 'Rename / change color',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save',
    pickerPlaceholder: 'Pick a location…',
    pickerNone: 'No location',
    pickerCreateNew: 'Create a new location…',
    customColor: 'Custom',
    pickColor: 'Pick a color',
    createAndSelect: 'Create & select',
    deleteConfirm: 'Delete the location "{name}"?',
    deleteConfirmWithChars:
      'Delete the location "{name}"?\n\n{n} character(s) will lose their location (they remain in the grimoire).',
    deleted: 'Location "{name}" deleted',
    countLabel: '{n} npc',
  },

  graph: {
    overline: 'Overview',
    title: 'Web of bonds',
    closePanel: 'Close panel',
    openPanel: 'Open panel',
    filters: 'Filters',
    summary: '{visible} / {total} pers.',
    summaryRels: '· {n} bonds',
    error: 'The graph could not be displayed',
    empty: 'No character to show in the graph.',
    searchPlaceholder: 'Search…',
    visibleCount: '{visible} / {total} characters · {rels} relations',
    sectionLocations: 'Locations',
    sectionType: 'Type',
    sectionRelationTypes: 'Relation types',
    sectionForces: 'Forces',
    selectAll: 'all',
    selectNone: 'none',
    noLocation: 'No location',
    noLocationDefined: 'No location defined.',
    typePC: 'Player Character',
    typeNPC: 'Non-Player Character',
    centerForce: 'Center force',
    repelForce: 'Repel force',
    linkForce: 'Link force',
    linkDistance: 'Link distance',
    freeze: 'Freeze',
    resume: 'Resume',
    reorganize: 'Reorganize',
    legendNode: 'Node = location',
    legendText:
      'Node colour reflects the character\'s location. Edges take the colour of the relation type. PCs are slightly larger with a gold ring. Drag a node to move it — the simulation will settle on its own.',
  },

  relation: {
    friend: 'Friend / Ally',
    family: 'Family',
    mentor: 'Mentor',
    companion: 'Companion',
    rival: 'Rival',
    enemy: 'Enemy',
    romance: 'Romance',
    acquaintance: 'Acquaintance',
    other: 'Other',
    closeFriend: 'Close friend',
    distrust: 'Distrust',
    swornEnemy: 'Sworn enemy',
    ally: 'Ally',
  },

  errors: {
    boundaryTitle: 'Something went wrong',
    boundaryDefault: 'The render failed.',
  },
};
