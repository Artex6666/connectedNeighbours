import bcrypt from 'bcryptjs';
import Message from '../models/Message.model';
import User from '../models/User.model';
import Neighborhood from '../models/Neighborhood.model';
import Service from '../models/Service.model';

function createConversationId(a: string, b: string) {
  return [a, b].sort().join('__');
}

export async function ensureDevSeedData() {
  const usersCount = await User.countDocuments();
  if (usersCount > 0) return;

  const hashedPassword = await bcrypt.hash('bobconnect123', 10);

  // ── Create admin first (needed for neighborhood adminId) ──────────────────
  const admin = await User.create({
    firstName: 'Alice', lastName: 'Bernard',
    email: 'admin@bobconnect.fr', password: hashedPassword,
    phone: '0615151617', address: 'Mairie du 11e, 75011 Paris',
    role: 'admin', points: 100, isVerified: true,
  });

  // ── Neighborhood ──────────────────────────────────────────────────────────
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

  // Assign neighborhood to admin
  await User.findByIdAndUpdate(admin._id, { neighborhoodId: neighborhood._id });

  // ── Other users ───────────────────────────────────────────────────────────
  const [jean, camille, nassim, sarah] = await User.create([
    {
      firstName: 'Jean', lastName: 'Dupont',
      email: 'jean@bobconnect.fr', password: hashedPassword,
      phone: '0601020304', address: '12 rue de Charonne, 75011 Paris',
      role: 'resident', points: 12, isVerified: true,
      neighborhoodId: neighborhood._id,
    },
    {
      firstName: 'Camille', lastName: 'Martin',
      email: 'camille@bobconnect.fr', password: hashedPassword,
      phone: '0605060708', address: '24 rue de Charonne, 75011 Paris',
      role: 'resident', points: 8, isVerified: true,
      neighborhoodId: neighborhood._id,
    },
    {
      firstName: 'Nassim', lastName: 'Leroy',
      email: 'nassim@bobconnect.fr', password: hashedPassword,
      phone: '0607080910', address: '7 passage Saint-Ambroise, 75011 Paris',
      role: 'moderator', points: 20, isVerified: true,
      neighborhoodId: neighborhood._id,
    },
    {
      firstName: 'Sarah', lastName: 'Benali',
      email: 'sarah@bobconnect.fr', password: hashedPassword,
      phone: '0611121314', address: '18 boulevard Richard-Lenoir, 75011 Paris',
      role: 'resident', points: 4, isVerified: true,
      neighborhoodId: neighborhood._id,
    },
  ]);

  // ── Services ──────────────────────────────────────────────────────────────
  await Service.insertMany([
    {
      title: 'Cours de guitare — débutants bienvenus',
      description: 'Je donne des cours de guitare acoustique le week-end. 1h de cours pour 2 points.',
      category: 'cours_particuliers', isPaid: true, points: 2,
      authorId: nassim._id, neighborhoodId: neighborhood._id, status: 'open',
    },
    {
      title: 'Garde de chat pendant les vacances',
      description: 'Disponible pour garder votre chat à mon domicile. Je suis présente toute la journée.',
      category: 'garde_animaux', isPaid: true, points: 3,
      authorId: camille._id, neighborhoodId: neighborhood._id, status: 'open',
    },
    {
      title: 'Aide au déménagement',
      description: 'Je cherche des bras pour m\'aider à déménager samedi prochain. En échange je vous offre à manger !',
      category: 'demenagement', isPaid: false, points: 0,
      authorId: jean._id, neighborhoodId: neighborhood._id, status: 'open',
    },
    {
      title: 'Petits travaux de bricolage',
      description: 'Montage de meubles IKEA, pose d\'étagères, petites réparations. 4 points de l\'heure.',
      category: 'bricolage', isPaid: true, points: 4,
      authorId: sarah._id, neighborhoodId: neighborhood._id, status: 'open',
    },
    {
      title: 'Jardinage et entretien balcon',
      description: 'Propose aide pour rempotage, taille et entretien de vos plantes de balcon.',
      category: 'jardinage', isPaid: true, points: 2,
      authorId: camille._id, neighborhoodId: neighborhood._id, status: 'open',
    },
  ]);

  // ── Messages ──────────────────────────────────────────────────────────────
  const now = Date.now();
  await Message.insertMany([
    {
      senderId: camille._id, receiverId: jean._id,
      conversationId: createConversationId(camille._id.toString(), jean._id.toString()),
      content: 'Je peux passer pour les plantes demain vers 18h si tu veux.',
      type: 'text', createdAt: new Date(now - 15 * 60_000), updatedAt: new Date(now - 15 * 60_000),
    },
    {
      senderId: jean._id, receiverId: camille._id,
      conversationId: createConversationId(camille._id.toString(), jean._id.toString()),
      content: 'Oui parfait, je te laisse le digicode en prive.',
      type: 'text', createdAt: new Date(now - 48 * 60_000), updatedAt: new Date(now - 48 * 60_000),
    },
    {
      senderId: nassim._id, receiverId: jean._id,
      conversationId: createConversationId(nassim._id.toString(), jean._id.toString()),
      content: 'La collecte de samedi est confirmee, on ouvre les inscriptions ce soir.',
      type: 'text', createdAt: new Date(now - 3 * 60 * 60_000), updatedAt: new Date(now - 3 * 60 * 60_000),
    },
  ]);

  console.log('[seed] Demo data created (neighborhood + users + services + messages)');
}
