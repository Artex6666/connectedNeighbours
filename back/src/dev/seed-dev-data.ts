import bcrypt from 'bcryptjs';
import Message from '../models/Message.model';
import User from '../models/User.model';

function createConversationId(firstUserId: string, secondUserId: string) {
  return [firstUserId, secondUserId].sort().join('__');
}

export async function ensureDevSeedData() {
  const usersCount = await User.countDocuments();
  if (usersCount > 0) {
    return;
  }

  const hashedPassword = await bcrypt.hash('bobconnect123', 10);

  const [jean, camille, nassim, sarah, admin] = await User.create([
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
    },
    {
      firstName: 'Alice',
      lastName: 'Bernard',
      email: 'admin@bobconnect.fr',
      password: hashedPassword,
      phone: '0615151617',
      address: 'Mairie du 11e, 75011 Paris',
      role: 'admin',
      points: 100,
      isVerified: true,
    },
  ]);

  const now = Date.now();

  await Message.insertMany([
    {
      senderId: camille._id,
      receiverId: jean._id,
      conversationId: createConversationId(camille._id.toString(), jean._id.toString()),
      content: 'Je peux passer pour les plantes demain vers 18h si tu veux.',
      type: 'text',
      createdAt: new Date(now - 15 * 60_000),
      updatedAt: new Date(now - 15 * 60_000),
    },
    {
      senderId: jean._id,
      receiverId: camille._id,
      conversationId: createConversationId(camille._id.toString(), jean._id.toString()),
      content: 'Oui parfait, je te laisse le digicode en prive.',
      type: 'text',
      createdAt: new Date(now - 48 * 60_000),
      updatedAt: new Date(now - 48 * 60_000),
    },
    {
      senderId: camille._id,
      receiverId: jean._id,
      conversationId: createConversationId(camille._id.toString(), jean._id.toString()),
      content: 'Message vocal - 0:18',
      type: 'audio',
      createdAt: new Date(now - 2 * 60 * 60_000),
      updatedAt: new Date(now - 2 * 60 * 60_000),
    },
    {
      senderId: nassim._id,
      receiverId: jean._id,
      conversationId: createConversationId(nassim._id.toString(), jean._id.toString()),
      content: 'La collecte de samedi est confirmee, on ouvre les inscriptions ce soir.',
      type: 'text',
      createdAt: new Date(now - 3 * 60 * 60_000),
      updatedAt: new Date(now - 3 * 60 * 60_000),
    },
    {
      senderId: jean._id,
      receiverId: nassim._id,
      conversationId: createConversationId(nassim._id.toString(), jean._id.toString()),
      content: 'Super, je relaie l info sur le groupe de voisins.',
      type: 'text',
      createdAt: new Date(now - 4 * 60 * 60_000),
      updatedAt: new Date(now - 4 * 60 * 60_000),
    },
    {
      senderId: jean._id,
      receiverId: sarah._id,
      conversationId: createConversationId(sarah._id.toString(), jean._id.toString()),
      content: 'Merci pour le document signe, je l ai bien recu.',
      type: 'text',
      createdAt: new Date(now - 27 * 60 * 60_000),
      updatedAt: new Date(now - 27 * 60 * 60_000),
    },
    {
      senderId: sarah._id,
      receiverId: jean._id,
      conversationId: createConversationId(sarah._id.toString(), jean._id.toString()),
      content: 'Parfait, je te renvoie aussi la version PDF archivee.',
      type: 'text',
      createdAt: new Date(now - 28 * 60 * 60_000),
      updatedAt: new Date(now - 28 * 60 * 60_000),
    },
  ]);

  console.log('[seed] Demo Mongo data created');
  void admin;
}
