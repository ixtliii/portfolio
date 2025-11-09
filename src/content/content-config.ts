import { defineCollection, z } from 'astro:content';

import { glob, file } from 'astro/loaders';

const projectsCollection =
    defineCollection({ loader: glob({ pattern: ['*.md', '!voyager-*'], base: 'src/data/space-probes' }),
    schema: z.object({
        id: z.number(),
        title: z.string(),
        description: z.string().optional(),
        image: z.string().optional(),
        label: z.string().optional(),
    }),
    });


const blogsCollection =
    defineCollection({ loader: glob({ pattern: ['*.md', '!voyager-*'], base: 'src/data/space-probes' }),
    schema: z.object({
        id: z.number(),
        title: z.string(),
        description: z.string().optional(),
        date: z.string().optional(),
    }),
    });

export const collections = { projectsCollection, blogsCollection };