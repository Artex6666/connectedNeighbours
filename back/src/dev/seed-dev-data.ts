import bcrypt from 'bcryptjs';
import Message from '../models/Message.model';
import User from '../models/User.model';
import Neighborhood from '../models/Neighborhood.model';
import Service from '../models/Service.model';
import Event from '../models/Event.model';
import Vote from '../models/Vote.model';
import Group from '../models/Group.model';
import GroupMessage from '../models/GroupMessage.model';
import Incident from '../models/incident.model';
import Alerte from '../models/alerte.model';

function createConversationId(a: string, b: string) {
  return [a, b].sort().join('__');
}

/**
 * Garantit que le compte administrateur de démonstration existe,
 * même lorsque la base contient déjà d'autres utilisateurs.
 */
async function ensureDemoAdmin() {
  const existing = await User.findOne({
    email: 'admin@bobconnect.fr',
  });

  if (existing) {
    return;
  }

  const hashedPassword = await bcrypt.hash('bobconnect123', 10);
  const neighborhood = await Neighborhood.findOne();

  const admin = await User.create({
    firstName: 'Alice',
    lastName: 'Bernard',
    email: 'admin@bobconnect.fr',
    password: hashedPassword,
    phone: '0615151617',
    address: 'Mairie du 11e, 75011 Paris',
    role: 'admin',
    points: 100,
    isVerified: true,
    neighborhoodId: neighborhood?._id,
  });

  if (neighborhood && !neighborhood.adminId) {
    await Neighborhood.findByIdAndUpdate(neighborhood._id, {
      adminId: admin._id,
    });
  }

  console.log('[seed] Admin de démonstration créé');
}

/**
 * Garantit que le compte résident de démonstration existe,
 * même lorsque la base contient déjà d'autres utilisateurs.
 */
async function ensureDemoResident() {
  const existing = await User.findOne({
    email: 'jean@bobconnect.fr',
  });

  if (existing) {
    return;
  }

  const hashedPassword = await bcrypt.hash('bobconnect123', 10);
  const neighborhood = await Neighborhood.findOne();

  await User.create({
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean@bobconnect.fr',
    password: hashedPassword,
    phone: '0601020304',
    address: '12 rue de Charonne, 75011 Paris',
    role: 'resident',
    points: 12,
    isVerified: true,
    neighborhoodId: neighborhood?._id,
  });

  console.log('[seed] Résident de démonstration créé');
}

export async function ensureDevSeedData() {
  const usersCount = await User.countDocuments();

  if (usersCount === 0) {
    await seedUsersAndBase();
  } else {
    await ensureDemoAdmin();
    await ensureDemoResident();
  }

  await seedEventsIfMissing();
  await seedVotesIfMissing();
  await seedGroupsIfMissing();
  await seedIncidentsIfMissing();
  await seedAlertesIfMissing();
}

// ─── Users, neighborhood, services, messages ──────────────────────────────────

async function seedUsersAndBase() {
  const hashedPassword = await bcrypt.hash('bobconnect123', 10);

  const admin = await User.create({
    firstName: 'Alice',
    lastName: 'Bernard',
    email: 'admin@bobconnect.fr',
    password: hashedPassword,
    phone: '0615151617',
    address: 'Mairie du 11e, 75011 Paris',
    role: 'admin',
    points: 100,
    isVerified: true,
  });

  const neighborhood = await Neighborhood.create({
    name: 'Paris 11e — République / Bastille',
    description: 'Quartier entre République et Bastille, Paris 11e arrondissement.',
    polygon: {
      type: 'Polygon',
      coordinates: [[
        [2.3600, 48.8530],
        [2.3750, 48.8530],
        [2.3750, 48.8630],
        [2.3600, 48.8630],
        [2.3600, 48.8530],
      ]],
    },
    adminId: admin._id,
  });

  await User.findByIdAndUpdate(admin._id, {
    neighborhoodId: neighborhood._id,
  });

  const [jean, camille, nassim, sarah] = await User.create([
    {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean@bobconnect.fr',
      password: hashedPassword,
      phone: '0601020304',
      address: '12 rue de Charonne, 75011 Paris',
      role: 'resident',
      points: 12,
      isVerified: true,
      neighborhoodId: neighborhood._id,
    },
    {
      firstName: 'Camille',
      lastName: 'Martin',
      email: 'camille@bobconnect.fr',
      password: hashedPassword,
      phone: '0605060708',
      address: '24 rue de Charonne, 75011 Paris',
      role: 'resident',
      points: 8,
      isVerified: true,
      neighborhoodId: neighborhood._id,
    },
    {
      firstName: 'Nassim',
      lastName: 'Leroy',
      email: 'nassim@bobconnect.fr',
      password: hashedPassword,
      phone: '0607080910',
      address: '7 passage Saint-Ambroise, 75011 Paris',
      role: 'moderator',
      points: 20,
      isVerified: true,
      neighborhoodId: neighborhood._id,
    },
    {
      firstName: 'Sarah',
      lastName: 'Benali',
      email: 'sarah@bobconnect.fr',
      password: hashedPassword,
      phone: '0611121314',
      address: '18 boulevard Richard-Lenoir, 75011 Paris',
      role: 'resident',
      points: 4,
      isVerified: true,
      neighborhoodId: neighborhood._id,
    },
  ]);

  await Service.insertMany([
    {
      title: 'Cours de guitare — débutants bienvenus',
      description: 'Je donne des cours de guitare acoustique le week-end. 1h de cours pour 2 points.',
      category: 'cours_particuliers',
      isPaid: true,
      points: 2,
      authorId: nassim._id,
      neighborhoodId: neighborhood._id,
      status: 'open',
    },
    {
      title: 'Garde de chat pendant les vacances',
      description: 'Disponible pour garder votre chat à mon domicile. Je suis présente toute la journée.',
      category: 'garde_animaux',
      isPaid: true,
      points: 3,
      authorId: camille._id,
      neighborhoodId: neighborhood._id,
      status: 'open',
    },
    {
      title: 'Aide au déménagement',
      description: 'Je cherche des bras pour m\'aider à déménager samedi prochain. En échange je vous offre à manger !',
      category: 'demenagement',
      isPaid: false,
      points: 0,
      authorId: jean._id,
      neighborhoodId: neighborhood._id,
      status: 'open',
    },
    {
      title: 'Petits travaux de bricolage',
      description: 'Montage de meubles IKEA, pose d\'étagères, petites réparations. 4 points de l\'heure.',
      category: 'bricolage',
      isPaid: true,
      points: 4,
      authorId: sarah._id,
      neighborhoodId: neighborhood._id,
      status: 'open',
    },
    {
      title: 'Jardinage et entretien balcon',
      description: 'Propose aide pour rempotage, taille et entretien de vos plantes de balcon.',
      category: 'jardinage',
      isPaid: true,
      points: 2,
      authorId: camille._id,
      neighborhoodId: neighborhood._id,
      status: 'open',
    },
  ]);

  const now = Date.now();

  await Message.insertMany([
    {
      senderId: camille._id,
      receiverId: jean._id,
      conversationId: createConversationId(
        camille._id.toString(),
        jean._id.toString(),
      ),
      content: 'Je peux passer pour les plantes demain vers 18h si tu veux.',
      type: 'text',
      createdAt: new Date(now - 15 * 60_000),
      updatedAt: new Date(now - 15 * 60_000),
    },
    {
      senderId: jean._id,
      receiverId: camille._id,
      conversationId: createConversationId(
        camille._id.toString(),
        jean._id.toString(),
      ),
      content: 'Oui parfait, je te laisse le digicode en prive.',
      type: 'text',
      createdAt: new Date(now - 48 * 60_000),
      updatedAt: new Date(now - 48 * 60_000),
    },
    {
      senderId: nassim._id,
      receiverId: jean._id,
      conversationId: createConversationId(
        nassim._id.toString(),
        jean._id.toString(),
      ),
      content: 'La collecte de samedi est confirmee, on ouvre les inscriptions ce soir.',
      type: 'text',
      createdAt: new Date(now - 3 * 60 * 60_000),
      updatedAt: new Date(now - 3 * 60 * 60_000),
    },
  ]);

  // ── Deuxième quartier (pour une carte plus vivante) ──────────────────────────

  const neighborhood2 = await Neighborhood.create({
    name: 'Paris 10e — Canal Saint-Martin',
    description: 'Le long du Canal Saint-Martin, entre République et Gare de l\'Est.',
    polygon: {
      type: 'Polygon',
      coordinates: [[
        [2.3580, 48.8680],
        [2.3720, 48.8680],
        [2.3720, 48.8770],
        [2.3580, 48.8770],
        [2.3580, 48.8680],
      ]],
    },
    adminId: admin._id,
  });

  const [marc, lea, hugo] = await User.create([
    {
      firstName: 'Marc',
      lastName: 'Petit',
      email: 'marc@bobconnect.fr',
      password: hashedPassword,
      phone: '0620304050',
      address: '5 quai de Valmy, 75010 Paris',
      role: 'resident',
      points: 16,
      isVerified: true,
      neighborhoodId: neighborhood2._id,
    },
    {
      firstName: 'Léa',
      lastName: 'Moreau',
      email: 'lea@bobconnect.fr',
      password: hashedPassword,
      phone: '0621314151',
      address: '14 rue Bichat, 75010 Paris',
      role: 'resident',
      points: 9,
      isVerified: true,
      neighborhoodId: neighborhood2._id,
    },
    {
      firstName: 'Hugo',
      lastName: 'Faure',
      email: 'hugo@bobconnect.fr',
      password: hashedPassword,
      phone: '0622324252',
      address: '30 rue de Lancry, 75010 Paris',
      role: 'resident',
      points: 6,
      isVerified: true,
      neighborhoodId: neighborhood2._id,
    },
  ]);

  await Service.insertMany([
    {
      title: 'Prêt de perceuse et outils',
      description: 'Je prête volontiers ma perceuse et ma caisse à outils aux voisins. Passez quand vous voulez !',
      category: 'bricolage',
      isPaid: false,
      points: 0,
      authorId: marc._id,
      neighborhoodId: neighborhood2._id,
      status: 'open',
    },
    {
      title: 'Cours de cuisine italienne',
      description: 'Pâtes fraîches, risotto, tiramisu… Je partage mes recettes de famille. 3 points la session.',
      category: 'cours_particuliers',
      isPaid: true,
      points: 3,
      authorId: lea._id,
      neighborhoodId: neighborhood2._id,
      status: 'open',
    },
    {
      title: 'Promenade de chiens le matin',
      description: 'Disponible tôt le matin pour promener vos chiens le long du canal. 2 points la balade.',
      category: 'garde_animaux',
      isPaid: true,
      points: 2,
      authorId: hugo._id,
      neighborhoodId: neighborhood2._id,
      status: 'open',
    },
    {
      title: 'Aide aux courses pour personnes âgées',
      description: 'Bénévolement, je fais les courses pour les voisins qui ont du mal à se déplacer.',
      category: 'autre',
      isPaid: false,
      points: 0,
      authorId: lea._id,
      neighborhoodId: neighborhood2._id,
      status: 'open',
    },
  ]);

  console.log(
    '[seed] Base data created (2 neighborhoods + users + services + messages)',
  );
}

// ─── Events (incrémental — s'exécute même si les users existent déjà) ─────────

async function seedEventsIfMissing() {
  const eventsCount = await Event.countDocuments();

  if (eventsCount > 0) {
    return;
  }

  const [nassim, camille, jean, sarah] = await Promise.all([
    User.findOne({ email: 'nassim@bobconnect.fr' }),
    User.findOne({ email: 'camille@bobconnect.fr' }),
    User.findOne({ email: 'jean@bobconnect.fr' }),
    User.findOne({ email: 'sarah@bobconnect.fr' }),
  ]);

  if (!nassim || !camille || !jean || !sarah) {
    console.warn('[seed] Users de démo introuvables, skip events');
    return;
  }

  const neighborhoodId = nassim.neighborhoodId;

  if (!neighborhoodId) {
    console.warn('[seed] Quartier introuvable sur nassim, skip events');
    return;
  }

  const today = new Date();

  const days = (n: number) =>
    new Date(today.getTime() + n * 24 * 60 * 60 * 1000);

  await Event.insertMany([
    {
      title: 'Repas de quartier — Place Léon Blum',
      description: 'Grande tablée conviviale pour se retrouver entre voisins. Chacun apporte un plat à partager. Boissons et couverts fournis.',
      date: days(5),
      location: 'Place Léon Blum, 75011 Paris',
      maxParticipants: 40,
      organizerId: nassim._id,
      neighborhoodId,
      participants: [nassim._id, camille._id],
    },
    {
      title: 'Atelier jardinage partagé',
      description: 'Venez apprendre à faire pousser des herbes aromatiques sur votre balcon. Graines et pots fournis, amenez vos gants !',
      date: days(12),
      location: 'Jardin partagé Saint-Ambroise, 75011 Paris',
      maxParticipants: 15,
      organizerId: camille._id,
      neighborhoodId,
      participants: [camille._id, sarah._id],
    },
    {
      title: 'Collecte de vêtements solidaire',
      description: 'Nous organisons une collecte de vêtements pour les associations locales. Apportez vos dons entre 10h et 17h.',
      date: days(3),
      location: 'Salle polyvalente, 23 rue de la Roquette, 75011 Paris',
      maxParticipants: 20,
      organizerId: nassim._id,
      neighborhoodId,
      participants: [nassim._id, camille._id, sarah._id],
    },
    {
      title: 'Tournoi de pétanque du quartier',
      description: 'Tournoi amical ouvert à tous ! Équipes de 2 personnes. Inscription sur place. Petite collation offerte aux participants.',
      date: days(19),
      location: 'Square de la République, 75011 Paris',
      maxParticipants: 24,
      organizerId: jean._id,
      neighborhoodId,
      participants: [jean._id],
    },
  ]);

  console.log('[seed] Events de démo créés (4 événements)');
}

// ─── Sondages (créés par les utilisateurs test, avec résultats) ────────────────

async function seedVotesIfMissing() {
  if ((await Vote.countDocuments()) > 0) {
    return;
  }

  const emails = [
    'jean@bobconnect.fr',
    'camille@bobconnect.fr',
    'nassim@bobconnect.fr',
    'sarah@bobconnect.fr',
    'marc@bobconnect.fr',
    'lea@bobconnect.fr',
    'hugo@bobconnect.fr',
  ];

  const users = await User.find({
    email: {
      $in: emails,
    },
  }).select('email neighborhoodId');

  const u = (email: string) =>
    users.find((user) => user.email === email);

  const jean = u('jean@bobconnect.fr');
  const camille = u('camille@bobconnect.fr');
  const nassim = u('nassim@bobconnect.fr');
  const sarah = u('sarah@bobconnect.fr');
  const marc = u('marc@bobconnect.fr');
  const lea = u('lea@bobconnect.fr');
  const hugo = u('hugo@bobconnect.fr');

  if (
    !jean ||
    !camille ||
    !nassim ||
    !sarah ||
    !marc ||
    !lea ||
    !hugo
  ) {
    return;
  }

  const now = Date.now();
  const openAt = new Date(now - 2 * 864e5);
  const closeAt = new Date(now + 10 * 864e5);

  type B = {
    userId: unknown;
    choices?: number[];
    weights?: number[];
  };

  const build = (
    question: string,
    type: string,
    labels: string[],
    author: {
      _id: unknown;
      neighborhoodId?: unknown;
    },
    ballots: B[],
    extra: Record<string, unknown> = {},
  ) => {
    const options = labels.map((label) => ({
      label,
      votes: 0,
    }));

    for (const ballot of ballots) {
      if (ballot.weights) {
        ballot.weights.forEach((weight, index) => {
          options[index].votes += weight;
        });
      } else {
        (ballot.choices ?? []).forEach((index) => {
          options[index].votes += 1;
        });
      }
    }

    return {
      question,
      type,
      options,
      authorId: author._id,
      neighborhoodId: author.neighborhoodId,
      openAt,
      closeAt,
      showResultsLive: true,
      voters: ballots.map((ballot) => ballot.userId),
      ballots,
      ...extra,
    };
  };

  await Vote.insertMany([
    build(
      'Installer un composteur partagé dans la cour ?',
      'yesno',
      ['Pour', 'Contre'],
      nassim,
      [
        {
          userId: jean._id,
          choices: [0],
        },
        {
          userId: camille._id,
          choices: [0],
        },
        {
          userId: sarah._id,
          choices: [0],
        },
      ],
    ),
    build(
      'Quel jour pour le prochain repas de quartier ?',
      'single',
      ['Vendredi', 'Samedi', 'Dimanche'],
      camille,
      [
        {
          userId: jean._id,
          choices: [1],
        },
        {
          userId: sarah._id,
          choices: [1],
        },
        {
          userId: nassim._id,
          choices: [0],
        },
      ],
    ),
    build(
      'Quels ateliers aimeriez-vous voir organisés ?',
      'multiple',
      ['Jardinage', 'Cuisine', 'Bricolage', 'Sport'],
      jean,
      [
        {
          userId: camille._id,
          choices: [0, 1],
        },
        {
          userId: sarah._id,
          choices: [0, 3],
        },
        {
          userId: nassim._id,
          choices: [2],
        },
      ],
      {
        quorum: 3,
      },
    ),
    build(
      'Faut-il demander plus d\'éclairage le long du canal ?',
      'yesno',
      ['Pour', 'Contre'],
      marc,
      [
        {
          userId: lea._id,
          choices: [0],
        },
        {
          userId: hugo._id,
          choices: [0],
        },
      ],
    ),
    build(
      'Répartissez 10 points entre ces projets de quartier',
      'weighted',
      ['Bancs', 'Pistes cyclables', 'Espaces verts', 'Aire de jeux'],
      lea,
      [
        {
          userId: marc._id,
          weights: [4, 3, 2, 1],
        },
        {
          userId: hugo._id,
          weights: [2, 2, 4, 2],
        },
      ],
      {
        isAnonymous: true,
      },
    ),
  ]);

  console.log(
    '[seed] Sondages créés (5 votes par les utilisateurs test)',
  );
}

// ─── Groupe de discussion ──────────────────────────────────────────────────────

async function seedGroupsIfMissing() {
  if ((await Group.countDocuments()) > 0) {
    return;
  }

  const [nassim, camille, jean] = await Promise.all([
    User.findOne({
      email: 'nassim@bobconnect.fr',
    }),
    User.findOne({
      email: 'camille@bobconnect.fr',
    }),
    User.findOne({
      email: 'jean@bobconnect.fr',
    }),
  ]);

  if (!nassim || !camille || !jean || !nassim.neighborhoodId) {
    return;
  }

  const group = await Group.create({
    name: 'Repas de quartier 2026',
    description: 'Organisation du grand repas de quartier place Léon Blum.',
    neighborhoodId: nassim.neighborhoodId,
    createdBy: nassim._id,
    members: [
      nassim._id,
      camille._id,
      jean._id,
    ],
  });

  await GroupMessage.insertMany([
    {
      groupId: group._id,
      senderId: nassim._id,
      content: 'On vise le 14 juin, ça vous va ?',
    },
    {
      groupId: group._id,
      senderId: camille._id,
      content: 'Parfait pour moi ! J\'amène une grande salade.',
    },
    {
      groupId: group._id,
      senderId: jean._id,
      content: 'Je m\'occupe des boissons et des tables.',
    },
  ]);

  console.log('[seed] Groupe de discussion créé');
}

// ─── Incidents (incrémental — s'exécute même si les users existent déjà) ──────

async function seedIncidentsIfMissing() {
  if ((await Incident.countDocuments()) > 0) {
    return;
  }

  const [nassim, camille, jean, sarah, marc, lea] = await Promise.all([
    User.findOne({ email: 'nassim@bobconnect.fr' }),
    User.findOne({ email: 'camille@bobconnect.fr' }),
    User.findOne({ email: 'jean@bobconnect.fr' }),
    User.findOne({ email: 'sarah@bobconnect.fr' }),
    User.findOne({ email: 'marc@bobconnect.fr' }),
    User.findOne({ email: 'lea@bobconnect.fr' }),
  ]);

  if (!nassim || !camille || !jean || !sarah || !marc || !lea) {
    console.warn('[seed] Users de démo introuvables, skip incidents');
    return;
  }

  const now = Date.now();
  const daysAgo = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000);

  await Incident.insertMany([
    {
      title: 'Lampadaire cassé rue de Charonne',
      description: 'Le lampadaire au niveau du numéro 12 ne s\'allume plus depuis trois jours.',
      status: 'open',
      priority: 'medium',
      createdBy: jean._id,
      neighborhoodId: jean.neighborhoodId,
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      title: 'Dépôt sauvage passage Saint-Ambroise',
      description: 'Des encombrants ont été déposés devant l\'immeuble, ça bloque une partie du trottoir.',
      status: 'in_progress',
      priority: 'high',
      createdBy: nassim._id,
      neighborhoodId: nassim.neighborhoodId,
      createdAt: daysAgo(4),
      updatedAt: daysAgo(2),
    },
    {
      title: 'Fuite d\'eau boulevard Richard-Lenoir',
      description: 'Fuite visible sur la chaussée près du numéro 18, risque de verglas si le froid continue.',
      status: 'open',
      priority: 'high',
      createdBy: sarah._id,
      neighborhoodId: sarah.neighborhoodId,
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
    },
    {
      title: 'Tag sur la façade de la salle polyvalente',
      description: 'Tags apparus sur le mur côté rue de la Roquette, à nettoyer avant l\'événement du week-end.',
      status: 'resolved',
      priority: 'low',
      createdBy: camille._id,
      neighborhoodId: camille.neighborhoodId,
      createdAt: daysAgo(10),
      updatedAt: daysAgo(7),
    },
    {
      title: 'Nid de poule quai de Valmy',
      description: 'Trou important sur la chaussée, déjà signalé deux fois par des cyclistes.',
      status: 'open',
      priority: 'medium',
      createdBy: marc._id,
      neighborhoodId: marc.neighborhoodId,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
    {
      title: 'Éclairage défaillant rue Bichat',
      description: 'Plusieurs lampadaires clignotent la nuit, quartier mal éclairé entre 22h et minuit.',
      status: 'in_progress',
      priority: 'medium',
      createdBy: lea._id,
      neighborhoodId: lea.neighborhoodId,
      createdAt: daysAgo(6),
      updatedAt: daysAgo(1),
    },
  ]);

  console.log('[seed] Incidents de démo créés (6 incidents)');
}

// ─── Alertes (incrémental — s'exécute même si les users existent déjà) ────────

async function seedAlertesIfMissing() {
  if ((await Alerte.countDocuments()) > 0) {
    return;
  }

  const [nassim, marc] = await Promise.all([
    User.findOne({ email: 'nassim@bobconnect.fr' }),
    User.findOne({ email: 'marc@bobconnect.fr' }),
  ]);

  if (!nassim || !marc) {
    console.warn('[seed] Users de démo introuvables, skip alertes');
    return;
  }

  const now = Date.now();
  const daysAgo = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000);

  await Alerte.insertMany([
    {
      title: 'Coupure d\'eau programmée',
      message: 'Coupure d\'eau prévue demain de 9h à 13h pour travaux de voirie rue de la Roquette.',
      level: 'info',
      active: true,
      neighborhoodId: nassim.neighborhoodId,
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      title: 'Cambriolages signalés dans le quartier',
      message: 'Plusieurs tentatives d\'effraction signalées cette semaine. Restez vigilants et signalez tout comportement suspect.',
      level: 'warning',
      active: true,
      neighborhoodId: nassim.neighborhoodId,
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    },
    {
      title: 'Risque d\'inondation — Canal Saint-Martin',
      message: 'Montée des eaux surveillée suite aux fortes pluies. Évitez les quais en cas de crue annoncée.',
      level: 'danger',
      active: true,
      neighborhoodId: marc.neighborhoodId,
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
    },
    {
      title: 'Collecte des déchets décalée',
      message: 'En raison d\'un jour férié, la collecte du mardi est décalée au mercredi cette semaine.',
      level: 'info',
      active: true,
      neighborhoodId: marc.neighborhoodId,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5),
    },
    {
      title: 'Travaux bruyants en journée',
      message: 'Des travaux de rénovation auront lieu de 8h à 18h toute la semaine place Léon Blum.',
      level: 'warning',
      active: true,
      neighborhoodId: nassim.neighborhoodId,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
    {
      title: 'Fuite de gaz — périmètre de sécurité',
      message: 'Périmètre de sécurité établi rue Bichat suite à une fuite de gaz. Évitez le secteur.',
      level: 'danger',
      active: false,
      neighborhoodId: marc.neighborhoodId,
      createdAt: daysAgo(8),
      updatedAt: daysAgo(6),
    },
  ]);

  console.log('[seed] Alertes de démo créées (6 alertes)');
}