import { defineCollection, z } from 'astro:content';

const projectsCollection = defineCollection({
    type: 'content',
    schema: z.object({
        id: z.number(),
        title: z.string(),
        description: z.string().optional(),
        image: z.string().optional(),
        label: z.string().optional(),
    }),
});


export const collections = {
    'projects': projectsCollection,
};