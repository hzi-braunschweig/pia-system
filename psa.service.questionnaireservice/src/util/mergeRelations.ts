/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable security/detect-object-injection */
import { FindOptionsRelations, FindOptionsRelationsProperty } from 'typeorm';

type FindOptionsRelationsPropertyForKey<
  Entity,
  Key extends keyof Entity
> = Key extends 'toString'
  ? unknown
  : FindOptionsRelationsProperty<NonNullable<Entity[Key]>>;

/**
 * Merges two relations into one. The second one will overwrite the first one.
 *
 * @param relationsA the first relation (won't be modified)
 * @param relationsB the second and preferred relation (won't be modified)
 * @returns the merged relations
 * @example
 * mergeRelations({ user: true, study: true }, { user: { id: true } })
 * // => { user: { id: true }, study: true }
 */
export function mergeRelations<Entity>(
  relationsA: FindOptionsRelations<Entity>,
  relationsB: FindOptionsRelations<Entity>
): FindOptionsRelations<Entity> {
  // prepare by cloning the first relation to make sure we don't modify the original
  const newRelations: FindOptionsRelations<Entity> =
    deepCloneRelation(relationsA);

  // loop through the second relation
  for (const key in relationsB) {
    const relationPropertyOfA = relationsA[key];
    const relationPropertyOfB = relationsB[key];

    // skip toString property
    if (key === 'toString') continue;

    // keep property of A if property of B is undefined
    if (relationPropertyOfB === undefined) continue;

    // if property of B is false, we can ignore any property of A
    if (relationPropertyOfB === false) {
      newRelations[key] = relationPropertyOfB;
      continue;
    }

    // if property of A is not a komplex object, we can simply overwrite it
    if (
      relationPropertyOfA === undefined ||
      typeof relationPropertyOfA === 'boolean'
    ) {
      if (typeof relationPropertyOfB === 'boolean') {
        newRelations[key] =
          relationPropertyOfB as FindOptionsRelationsPropertyForKey<
            Entity,
            typeof key
          >;
        continue;
      }
      newRelations[key] = deepCloneRelation<typeof key>(
        relationPropertyOfB
      ) as FindOptionsRelationsPropertyForKey<Entity, typeof key>;
      continue;
    }

    // if property of A is a komplex object and property of B is just true, we skip it, since it's already cloned
    if (relationPropertyOfB === true) {
      continue;
    }

    // if both are komplex objects, we merge them
    newRelations[key] = mergeRelations<typeof key>(
      relationPropertyOfA,
      relationPropertyOfB
    ) as FindOptionsRelationsPropertyForKey<Entity, typeof key>;
  }
  return newRelations;
}

/**
 * Deep clones a relation object to get a new object that can be modified without affecting the original
 * It will copy each boolean attribute of the original relation and recursively clone each object attribute
 *
 * @param obj the original relation object
 * @returns the clone
 */
function deepCloneRelation<Entity>(
  obj: FindOptionsRelations<Entity>
): FindOptionsRelations<Entity> {
  const clonedObj: FindOptionsRelations<Entity> = {};

  for (const key in obj) {
    const value = obj[key];
    if (key === 'toString') continue;
    if (value === undefined) continue;
    if (typeof value === 'boolean') {
      clonedObj[key] = value as FindOptionsRelationsPropertyForKey<
        Entity,
        typeof key
      >;
      continue;
    }
    clonedObj[key] = deepCloneRelation(
      value
    ) as FindOptionsRelationsPropertyForKey<Entity, typeof key>;
  }
  return clonedObj;
}
