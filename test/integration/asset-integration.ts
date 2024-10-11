const TEST_IMAGE_SOURCE_URL =
  'https://raw.githubusercontent.com/contentful/contentful-management.js/master/test/integration/fixtures/shiba-stuck-bush.jpg'

import { expect } from 'chai'
import { after, before, describe, test } from 'mocha'
import {
  initClient,
  getDefaultSpace,
  createTestSpace,
  initPlainClient,
  getTestOrganizationId,
} from '../helpers'
import type { ConceptProps, Environment, PlainClientAPI, Space } from '../../lib/export-types'

describe('Asset api', function () {
  describe('Read', () => {
    let space: Space
    let environment: Environment

    before(async () => {
      space = await getDefaultSpace()
      environment = await space.getEnvironment('master')
    })

    test('Gets assets with only images', async () => {
      return environment
        .getAssets({
          mimetype_group: 'image',
        })
        .then((response) => {
          expect(response.items[0].fields.file['en-US'].contentType).match(/image/)
        })
    })

    test('Gets asset', async () => {
      return environment.getAsset('1x0xpXu4pSGS4OukSyWGUK').then((response) => {
        expect(response.sys, 'sys').to.be.ok
        expect(response.fields, 'fields').to.be.ok
      })
    })

    test('Gets assets', async () => {
      return environment.getAssets().then((response) => {
        expect(response.items, 'items').to.be.ok
      })
    })

    test('Gets published assets', async () => {
      return environment.getPublishedAssets().then((response) => {
        expect(response.items, 'items').to.be.ok
      })
    })
  })

  // Write test seems currently broken
  describe('Write', function () {
    let space: Space
    let environment: Environment
    let client: PlainClientAPI

    before(async () => {
      client = initPlainClient({
        organizationId: getTestOrganizationId(),
      })
      space = await createTestSpace(initClient({ retryOnError: false }), 'Assets')
      environment = await space.getEnvironment('master')
      await environment.createLocale({
        name: 'German (Germany)',
        code: 'de-DE',
      })
    })

    after(async () => {
      if (space) {
        return space.delete()
      }
    })

    test('Create, process, update, publish, unpublish, archive, unarchive and delete asset', async function () {
      const asset = await environment.createAsset({
        fields: {
          title: { 'en-US': 'this is the title' },
          file: {
            'en-US': {
              contentType: 'image/jpeg',
              fileName: 'shiba-stuck.jpg',
              upload: TEST_IMAGE_SOURCE_URL,
            },
          },
        },
      })
      expect(asset.fields.title['en-US']).equals('this is the title', 'original title')

      const processedAsset = await asset.processForLocale('en-US', { processingCheckWait: 10000 })
      expect(asset.isDraft(), 'asset is in draft').to.be.true
      expect(processedAsset.fields.file['en-US'].url, 'file was uploaded').to.be.ok

      const publishedAsset = await processedAsset.publish()
      expect(publishedAsset.isPublished(), 'asset is published').to.be.true

      publishedAsset.fields.title['en-US'] = 'title has changed'
      const updatedAsset = await publishedAsset.update()
      expect(updatedAsset.isUpdated(), 'asset is updated').to.be.true
      expect(updatedAsset.fields.title['en-US']).equals('title has changed')

      const unpublishedAsset = await updatedAsset.unpublish()
      expect(unpublishedAsset.isDraft(), 'asset is back in draft').to.be.true

      const archivedAsset = await unpublishedAsset.archive()
      expect(archivedAsset.isArchived(), 'asset is archived').to.be.true

      const unarchivedAsset = await archivedAsset.unarchive()
      expect(unarchivedAsset.isArchived(), 'asset is not archived anymore').to.be.false
      expect(unarchivedAsset.isDraft(), 'asset is back in draft').to.be.true

      await unarchivedAsset.delete()
    })

    test('Create and process asset with multiple locales', async () => {
      const asset = await environment.createAsset({
        fields: {
          title: { 'en-US': 'this is the title' },
          file: {
            'en-US': {
              contentType: 'image/jpeg',
              fileName: 'shiba-stuck.jpg',
              upload: TEST_IMAGE_SOURCE_URL,
            },
            'de-DE': {
              contentType: 'image/jpeg',
              fileName: 'shiba-stuck.jpg',
              upload: TEST_IMAGE_SOURCE_URL,
            },
          },
        },
      })

      const processedAsset = await asset.processForAllLocales({ processingCheckWait: 5000 })
      expect(processedAsset.fields.file['en-US'].url, 'file en-US was uploaded').to.be.ok
      expect(processedAsset.fields.file['de-DE'].url, 'file de-DE was uploaded').to.be.ok
    })

    test('Upload and process asset from files with multiple locales', async () => {
      const asset = await environment.createAssetFromFiles({
        fields: {
          title: { 'en-US': 'SVG upload test' },
          file: {
            'en-US': {
              contentType: 'image/svg+xml',
              fileName: 'blue-square.svg',
              file: '<svg xmlns="http://www.w3.org/2000/svg"><path fill="blue" d="M50 50h150v50H50z"/></svg>',
            },
            'de-DE': {
              contentType: 'image/svg+xml',
              fileName: 'red-square.svg',
              file: '<svg xmlns="http://www.w3.org/2000/svg"><path fill="red" d="M50 50h150v50H50z"/></svg>',
            },
          },
          description: {},
        },
      })

      const processedAsset = await asset.processForAllLocales({ processingCheckWait: 5000 })
      expect(processedAsset.fields.file['en-US'].url, 'file en-US was uploaded').to.be.ok
      expect(processedAsset.fields.file['de-DE'].url, 'file de-DE was uploaded').to.be.ok
    })

    test.skip('Upload and process asset from files with multiple locales in non-master environment', async () => {
      environment = await space.createEnvironment({ name: 'Asset Processing Non-Master' })
      const asset = await environment.createAssetFromFiles({
        fields: {
          title: { 'en-US': 'SVG upload test' },
          file: {
            'en-US': {
              contentType: 'image/svg+xml',
              fileName: 'blue-square.svg',
              file: '<svg xmlns="http://www.w3.org/2000/svg"><path fill="blue" d="M50 50h150v50H50z"/></svg>',
            },
            'de-DE': {
              contentType: 'image/svg+xml',
              fileName: 'red-square.svg',
              file: '<svg xmlns="http://www.w3.org/2000/svg"><path fill="red" d="M50 50h150v50H50z"/></svg>',
            },
          },
          description: {},
        },
      })
      const processedAsset = await asset.processForAllLocales({ processingCheckWait: 5000 })
      expect(processedAsset.fields.file['en-US'].url, 'file en-US was uploaded').to.be.ok
      expect(processedAsset.fields.file['de-DE'].url, 'file de-DE was uploaded').to.be.ok
    })

    test('Upload and process asset with short custom timeout times out', async () => {
      try {
        expect(
          await environment.createAssetFromFiles(
            {
              fields: {
                title: { 'en-US': 'SVG upload test' },
                file: {
                  'en-US': {
                    contentType: 'image/svg+xml',
                    fileName: 'blue-square.svg',
                    file: '<svg xmlns="http://www.w3.org/2000/svg"><path fill="blue" d="M50 50h150v50H50z"/></svg>',
                  },
                },
                description: {},
              },
            },
            {
              uploadTimeout: 1,
            }
          )
        ).to.be.rejected
      } catch (e) {
        expect(e).to.be.instanceOf(Error)
      }
    })

    describe('Taxonomy', () => {
      const conceptsToCleanUp: ConceptProps[] = []

      after(async () => {
        for (const conceptToBeDeleted of conceptsToCleanUp) {
          await client.concept.delete({
            conceptId: conceptToBeDeleted.sys.id,
            version: conceptToBeDeleted.sys.version,
          })
        }
      })

      test('should create asset with concepts assigned when concepts provided', async () => {
        const newConcept = await client.concept.create(
          {},
          {
            prefLabel: {
              'en-US': 'Concept to be assigned',
            },
          }
        )
        conceptsToCleanUp.push(newConcept)

        const createdAsset = await environment.createAsset({
          fields: {
            title: {
              'en-US': 'this is the title of a newly created asset with a concept assigned',
            },
            file: {
              'en-US': {
                contentType: 'image/jpeg',
                fileName: 'shiba-stuck.jpg',
                upload: TEST_IMAGE_SOURCE_URL,
              },
            },
          },
          metadata: {
            concepts: [
              {
                sys: {
                  id: newConcept.sys.id,
                  linkType: 'TaxonomyConcept',
                  type: 'Link',
                },
              },
            ],
            tags: [],
          },
        })

        expect(createdAsset.metadata.concepts).lengthOf(1)
        expect(createdAsset.metadata.concepts[0].sys.id).to.eq(newConcept.sys.id)
      })

      test('should update asset with concepts assigned when concepts are provided', async () => {
        const newConcept = await client.concept.create(
          {},
          {
            prefLabel: {
              'en-US': 'Concept to be assigned',
            },
          }
        )
        conceptsToCleanUp.push(newConcept)

        const assetToUpdate = await environment.createAsset({
          fields: {
            title: { 'en-US': 'this asset should be updated with a concept assigned' },
            file: {
              'en-US': {
                contentType: 'image/jpeg',
                fileName: 'shiba-stuck.jpg',
                upload: TEST_IMAGE_SOURCE_URL,
              },
            },
          },
          // `metadata` intentionally omitted
        })
        expect(assetToUpdate.metadata.concepts).to.be.an('array').that.is.empty

        assetToUpdate.metadata = {
          concepts: [
            {
              sys: {
                id: newConcept.sys.id,
                linkType: 'TaxonomyConcept',
                type: 'Link',
              },
            },
          ],
          tags: [],
        }
        const updatedAsset = await assetToUpdate.update()
        expect(updatedAsset.metadata.concepts).lengthOf(1)
        expect(updatedAsset.metadata.concepts[0].sys.id).to.eq(newConcept.sys.id)
      })

      test('should update asset with concepts removed when concepts already exist', async () => {
        const newConcept = await client.concept.create(
          {},
          {
            prefLabel: {
              'en-US': 'Concept to be assigned',
            },
          }
        )
        conceptsToCleanUp.push(newConcept)
        const assetToDeleteConceptFrom = await environment.createAsset({
          fields: {
            title: { 'en-US': 'this is the title of an asset with a concept already assigned' },
            file: {
              'en-US': {
                contentType: 'image/jpeg',
                fileName: 'shiba-stuck.jpg',
                upload: TEST_IMAGE_SOURCE_URL,
              },
            },
          },
          metadata: {
            concepts: [
              {
                sys: {
                  id: newConcept.sys.id,
                  linkType: 'TaxonomyConcept',
                  type: 'Link',
                },
              },
            ],
            tags: [],
          },
        })
        expect(assetToDeleteConceptFrom.metadata.concepts).lengthOf(1)

        assetToDeleteConceptFrom.metadata.concepts = []
        const updatedAsset = await assetToDeleteConceptFrom.update()

        expect(updatedAsset.metadata.concepts).to.be.an('array').that.is.empty
      })
    })
  })
})
