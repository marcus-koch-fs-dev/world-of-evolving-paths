/** The key of a connection between two points. One place for the format, so a height is found again in every view. */
export const connectionKey = (fromId: string, toId: string) => `${fromId}>${toId}`;

/** Does the key of a connection involve this point? */
export const involves = (key: string, pointId: string) => key.split('>').includes(pointId);
