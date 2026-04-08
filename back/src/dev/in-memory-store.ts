import bcrypt from 'bcryptjs';

export type InMemoryUserRole = 'resident' | 'moderator' | 'admin';
export type InMemoryMessageType = 'text' | 'audio' | 'photo';

type InMemoryUser = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  role: InMemoryUserRole;
  points: number;
  isVerified: boolean;
  isMfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

type InMemoryMessage = {
  _id: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  content: string;
  type: InMemoryMessageType;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};

function nowIso() {
  return new Date().toISOString();
}

function createConversationId(firstUserId: string, secondUserId: string) {
  return [firstUserId, secondUserId].sort().join('__');
}

function createInitialUsers(): InMemoryUser[] {
  const timestamp = nowIso();

  return [
    {
      _id: 'user-demo-resident',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean@bobconnect.fr',
      password: bcrypt.hashSync('bobconnect123', 10),
      phone: '0601020304',
      address: '12 rue de Charonne, 75011 Paris',
      role: 'resident',
      points: 12,
      isVerified: true,
      isMfaEnabled: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      _id: 'user-camille',
      firstName: 'Camille',
      lastName: 'Martin',
      email: 'camille@bobconnect.fr',
      password: bcrypt.hashSync('bobconnect123', 10),
      phone: '0605060708',
      address: '24 rue de Charonne, 75011 Paris',
      role: 'resident',
      points: 8,
      isVerified: true,
      isMfaEnabled: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      _id: 'user-nassim',
      firstName: 'Nassim',
      lastName: 'Leroy',
      email: 'nassim@bobconnect.fr',
      password: bcrypt.hashSync('bobconnect123', 10),
      phone: '0607080910',
      address: '7 passage Saint-Ambroise, 75011 Paris',
      role: 'moderator',
      points: 20,
      isVerified: true,
      isMfaEnabled: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      _id: 'user-sarah',
      firstName: 'Sarah',
      lastName: 'Benali',
      email: 'sarah@bobconnect.fr',
      password: bcrypt.hashSync('bobconnect123', 10),
      phone: '0611121314',
      address: '18 boulevard Richard-Lenoir, 75011 Paris',
      role: 'resident',
      points: 4,
      isVerified: true,
      isMfaEnabled: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      _id: 'user-admin',
      firstName: 'Alice',
      lastName: 'Bernard',
      email: 'admin@bobconnect.fr',
      password: bcrypt.hashSync('bobconnect123', 10),
      phone: '0615151617',
      address: 'Mairie du 11e, 75011 Paris',
      role: 'admin',
      points: 100,
      isVerified: true,
      isMfaEnabled: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
}

function createInitialMessages() {
  const baseDate = new Date('2026-04-04T20:15:00.000Z');

  const createMessage = (
    id: string,
    senderId: string,
    receiverId: string,
    content: string,
    minutesOffset: number,
    type: InMemoryMessageType = 'text',
  ): InMemoryMessage => {
    const createdAt = new Date(baseDate.getTime() - minutesOffset * 60_000).toISOString();

    return {
      _id: id,
      senderId,
      receiverId,
      conversationId: createConversationId(senderId, receiverId),
      content,
      type,
      isRead: true,
      createdAt,
      updatedAt: createdAt,
    };
  };

  return [
    createMessage(
      'message-1',
      'user-camille',
      'user-demo-resident',
      'Je peux passer pour les plantes demain vers 18h si tu veux.',
      0,
    ),
    createMessage(
      'message-2',
      'user-demo-resident',
      'user-camille',
      'Oui parfait, je te laisse le digicode en prive.',
      33,
    ),
    createMessage(
      'message-3',
      'user-camille',
      'user-demo-resident',
      'Message vocal - 0:18',
      130,
      'audio',
    ),
    createMessage(
      'message-4',
      'user-nassim',
      'user-demo-resident',
      'La collecte de samedi est confirmee, on ouvre les inscriptions ce soir.',
      165,
    ),
    createMessage(
      'message-5',
      'user-demo-resident',
      'user-nassim',
      'Super, je relaie l info sur le groupe de voisins.',
      205,
    ),
    createMessage(
      'message-6',
      'user-demo-resident',
      'user-sarah',
      'Merci pour le document signe, je l ai bien recu.',
      1880,
    ),
    createMessage(
      'message-7',
      'user-sarah',
      'user-demo-resident',
      'Parfait, je te renvoie aussi la version PDF archivee.',
      1910,
    ),
  ];
}

const users = createInitialUsers();
const messages = createInitialMessages();

function createAvatar(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

function toPublicUser(user: InMemoryUser) {
  return {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role: user.role,
    points: user.points,
    isVerified: user.isVerified,
    isMfaEnabled: user.isMfaEnabled,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function findInMemoryUserByEmail(email: string) {
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export function findInMemoryUserById(userId: string) {
  return users.find((user) => user._id === userId);
}

export async function createInMemoryUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
}) {
  const timestamp = nowIso();
  const user: InMemoryUser = {
    _id: `user-${Date.now()}`,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email.toLowerCase(),
    password: await bcrypt.hash(input.password, 10),
    phone: input.phone,
    address: input.address,
    role: 'resident',
    points: 0,
    isVerified: true,
    isMfaEnabled: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  users.unshift(user);
  return toPublicUser(user);
}

export function listInMemoryUsers() {
  return users.map(toPublicUser);
}

export function updateInMemoryUser(
  userId: string,
  updates: Partial<Pick<InMemoryUser, 'firstName' | 'lastName' | 'phone' | 'address' | 'password'>>,
) {
  const user = findInMemoryUserById(userId);
  if (!user) {
    return null;
  }

  Object.assign(user, updates, { updatedAt: nowIso() });
  return toPublicUser(user);
}

export function deleteInMemoryUser(userId: string) {
  const userIndex = users.findIndex((user) => user._id === userId);
  if (userIndex === -1) {
    return null;
  }

  const [deletedUser] = users.splice(userIndex, 1);

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].senderId === userId || messages[index].receiverId === userId) {
      messages.splice(index, 1);
    }
  }

  return toPublicUser(deletedUser);
}

export function listInMemoryConversations(currentUserId: string) {
  const groupedConversations = new Map<string, InMemoryMessage>();

  for (const message of messages) {
    if (message.senderId !== currentUserId && message.receiverId !== currentUserId) {
      continue;
    }

    const otherUserId = message.senderId === currentUserId ? message.receiverId : message.senderId;
    const existing = groupedConversations.get(otherUserId);

    if (!existing || new Date(message.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
      groupedConversations.set(otherUserId, message);
    }
  }

  return [...groupedConversations.entries()]
    .map(([otherUserId, latestMessage]) => {
      const user = findInMemoryUserById(otherUserId);
      if (!user) {
        return null;
      }

      return {
        userId: user._id,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        avatar: createAvatar(user.firstName, user.lastName),
        lastMessage: latestMessage.content,
        lastTimestamp: latestMessage.createdAt,
      };
    })
    .filter((conversation): conversation is NonNullable<typeof conversation> => conversation !== null)
    .sort(
      (first, second) =>
        new Date(second.lastTimestamp).getTime() - new Date(first.lastTimestamp).getTime(),
    );
}

export function getInMemoryConversation(currentUserId: string, otherUserId: string) {
  const participant = findInMemoryUserById(otherUserId);
  if (!participant) {
    return null;
  }

  const conversationMessages = messages
    .filter(
      (message) =>
        (message.senderId === currentUserId && message.receiverId === otherUserId) ||
        (message.senderId === otherUserId && message.receiverId === currentUserId),
    )
    .sort((first, second) => new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime())
    .map((message) => ({
      _id: message._id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      type: message.type,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    }));

  return {
    participant: {
      userId: participant._id,
      name: `${participant.firstName} ${participant.lastName}`,
      role: participant.role,
      avatar: createAvatar(participant.firstName, participant.lastName),
    },
    messages: conversationMessages,
  };
}

export function sendInMemoryMessage(input: {
  senderId: string;
  receiverId: string;
  content: string;
  type: InMemoryMessageType;
}) {
  const timestamp = nowIso();

  const message: InMemoryMessage = {
    _id: `message-${Date.now()}`,
    senderId: input.senderId,
    receiverId: input.receiverId,
    conversationId: createConversationId(input.senderId, input.receiverId),
    content: input.content,
    type: input.type,
    isRead: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  messages.unshift(message);

  return {
    _id: message._id,
    senderId: message.senderId,
    receiverId: message.receiverId,
    content: message.content,
    type: message.type,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}

export { toPublicUser };
