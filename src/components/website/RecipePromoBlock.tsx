import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bookmark, BookPlus, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Recipe } from '../../types';
import { getCategoryColorCollection, COLOR_COLLECTIONS } from '../../utils/categoryColors';
import { 
  CategoryBadge, 
  IconOnlySubButton, 
  IconOnlyTileButton, 
  IconWithLabelButton 
} from '../DesignSystemTiles';

export const PROMO_RECIPES: Recipe[] = [
  {
    id: 'promo-novel',
    title: 'Time to Write That Novel',
    description: 'Transform your story idea into a completed, reader-ready manuscript with this complete 8-phase novel blueprint.',
    authorId: 'gonnng-writer',
    authorName: 'Novel Architect',
    category: 'Writing',
    tags: ['writing', 'novel', 'fiction', 'storytelling'],
    visibility: 'public',
    phases: [
      {
        id: 'p1-1',
        title: 'What Story Am I Actually Trying Going to Tell',
        tasks: [
          { id: 't1-1', title: 'Write a one-sentence description of the novel' },
          { id: 't1-2', title: 'Identify the central conflict' },
          { id: 't1-3', title: 'Define the protagonist, “what do they want?”' },
          { id: 't1-4', title: 'Define what prevents the protagonist from getting it' },
          { id: 't1-5', title: 'Identify the primary antagonist or opposing force' },
          { id: 't1-6', title: 'Determine the novel’s genre and subgenre' },
          { id: 't1-7', title: 'Identify the intended audience' },
          { id: 't1-8', title: 'Write a rough beginning-to-end story summary' },
          { id: 't1-9', title: 'Identify the emotional experience you want readers to have' },
          { id: 't1-10', title: 'Establish the themes the story should explore' },
          { id: 't1-11', title: 'Write a working synopsis' }
        ]
      },
      {
        id: 'p1-2',
        title: 'Build a World Around my Story',
        tasks: [
          { id: 't1-12', title: 'Define the story’s setting and time period' },
          { id: 't1-13', title: 'Research the historical or cultural setting' },
          { id: 't1-14', title: 'Establish the rules of the world' },
          { id: 't1-15', title: 'Define important locations' },
          { id: 't1-16', title: 'Create the political, social, or cultural structures' },
          { id: 't1-17', title: 'Determine what technology or resources exist' },
          { id: 't1-18', title: 'Identify important organizations, factions, or communities' },
          { id: 't1-19', title: 'Create the history behind the major conflict' },
          { id: 't1-20', title: 'Identify details that make the setting feel lived-in' },
          { id: 't1-21', title: 'Create a reference document for world-building decisions' }
        ]
      },
      {
        id: 'p1-3',
        title: 'Develop the Characters, Turn Them Into People',
        tasks: [
          { id: 't1-22', title: 'Create the protagonist’s character profile' },
          { id: 't1-23', title: 'Define the protagonist’s history' },
          { id: 't1-24', title: 'Identify the protagonist’s greatest desire' },
          { id: 't1-25', title: 'Identify the protagonist’s greatest fear' },
          { id: 't1-26', title: 'Define the protagonist’s internal conflict' },
          { id: 't1-27', title: 'Create the antagonist’s character profile' },
          { id: 't1-28', title: 'Define the antagonist’s motivation' },
          { id: 't1-29', title: 'Create profiles for major supporting characters' },
          { id: 't1-30', title: 'Define relationships between major characters' },
          { id: 't1-31', title: 'Determine how each major character changes' },
          { id: 't1-32', title: 'Identify each character’s role in the central conflict' }
        ]
      },
      {
        id: 'p1-4',
        title: 'Architect the Story From Beginning to End',
        tasks: [
          { id: 't1-33', title: 'Divide the story into major acts' },
          { id: 't1-34', title: 'Define the opening situation' },
          { id: 't1-35', title: 'Identify the inciting incident' },
          { id: 't1-36', title: 'Establish the first major turning point' },
          { id: 't1-37', title: 'Define the midpoint revelation or reversal' },
          { id: 't1-38', title: 'Establish the major escalation' },
          { id: 't1-39', title: 'Define the climax' },
          { id: 't1-40', title: 'Determine how the central conflict resolves' },
          { id: 't1-41', title: 'Outline the ending' },
          { id: 't1-42', title: 'Break each act into chapters' },
          { id: 't1-43', title: 'Write a one-paragraph summary for every chapter' },
          { id: 't1-44', title: 'Identify missing transitions between major events' }
        ]
      },
      {
        id: 'p1-5',
        title: 'Establish A Doable Writing System',
        tasks: [
          { id: 't1-45', title: 'Choose a realistic writing schedule' },
          { id: 't1-46', title: 'Determine a weekly word-count target' },
          { id: 't1-47', title: 'Choose the primary writing application' },
          { id: 't1-48', title: 'Create the novel’s project folder structure' },
          { id: 't1-49', title: 'Create a character reference document' },
          { id: 't1-50', title: 'Create a world-building reference document' },
          { id: 't1-51', title: 'Create a chapter outline document' },
          { id: 't1-52', title: 'Establish naming conventions for drafts' },
          { id: 't1-53', title: 'Create a backup system for manuscripts' },
          { id: 't1-54', title: 'Schedule recurring writing sessions' },
          { id: 't1-55', title: 'Define rules for handling unfinished chapters' }
        ]
      },
      {
        id: 'p1-6',
        title: 'Draft a Manuscript Nonstop',
        tasks: [
          { id: 't1-56', title: 'Write the opening chapter' },
          { id: 't1-57', title: 'Complete the first major section' },
          { id: 't1-58', title: 'Continue drafting according to the chapter outline' },
          { id: 't1-59', title: 'Track completed chapters' },
          { id: 't1-60', title: 'Track unresolved story threads' },
          { id: 't1-61', title: 'Record new ideas without interrupting the draft' },
          { id: 't1-62', title: 'Review continuity when major story changes occur' },
          { id: 't1-63', title: 'Complete the midpoint' },
          { id: 't1-64', title: 'Complete the final act' },
          { id: 't1-65', title: 'Write the final chapter' },
          { id: 't1-66', title: 'Complete the first full manuscript' }
        ]
      },
      {
        id: 'p1-7',
        title: 'Turn the Draft Into a Finished Work',
        tasks: [
          { id: 't1-67', title: 'Read the complete manuscript without editing' },
          { id: 't1-68', title: 'Identify major structural problems' },
          { id: 't1-69', title: 'Verify character arcs' },
          { id: 't1-70', title: 'Resolve unfinished story threads' },
          { id: 't1-71', title: 'Remove unnecessary scenes' },
          { id: 't1-72', title: 'Rewrite weak chapters' },
          { id: 't1-73', title: 'Strengthen the opening' },
          { id: 't1-74', title: 'Strengthen the climax' },
          { id: 't1-75', title: 'Perform a continuity review' },
          { id: 't1-76', title: 'Perform a character consistency review' },
          { id: 't1-77', title: 'Perform a pacing review' },
          { id: 't1-78', title: 'Complete the second draft' }
        ]
      },
      {
        id: 'p1-8',
        title: 'Time To Make the Piece Reader Ready',
        tasks: [
          { id: 't1-79', title: 'Perform line editing' },
          { id: 't1-80', title: 'Correct grammar and spelling' },
          { id: 't1-81', title: 'Standardize formatting' },
          { id: 't1-82', title: 'Create the final manuscript' },
          { id: 't1-83', title: 'Develop a book title' },
          { id: 't1-84', title: 'Write the back-cover description' },
          { id: 't1-85', title: 'Write the author biography' },
          { id: 't1-86', title: 'Develop cover-art requirements' },
          { id: 't1-87', title: 'Determine publishing format' },
          { id: 't1-88', title: 'Research publishing or submission requirements' },
          { id: 't1-89', title: 'Prepare the manuscript for publication' }
        ]
      }
    ]
  },
  {
    id: 'promo-garden',
    title: 'Plant the Backyard Garden',
    description: 'Design, prepare, seed, cultivate, and harvest an abundant homegrown vegetable and fruit garden.',
    authorId: 'gonnng-gardener',
    authorName: 'Green Thumb Botanist',
    category: 'Design',
    tags: ['gardening', 'design', 'plants', 'outdoors'],
    visibility: 'public',
    phases: [
      {
        id: 'p2-1',
        title: 'What Can My Backyard Support',
        tasks: [
          { id: 't2-1', title: 'Measure the available gardening area' },
          { id: 't2-2', title: 'Identify areas receiving full sun' },
          { id: 't2-3', title: 'Identify areas receiving partial shade' },
          { id: 't2-4', title: 'Observe how sunlight changes throughout the day' },
          { id: 't2-5', title: 'Identify existing drainage problems' },
          { id: 't2-6', title: 'Determine the soil type' },
          { id: 't2-7', title: 'Test the existing soil' },
          { id: 't2-8', title: 'Identify potential water sources' },
          { id: 't2-9', title: 'Determine whether the garden needs fencing' },
          { id: 't2-10', title: 'Identify animals or pests that could affect the garden' },
          { id: 't2-11', title: 'Choose the garden’s approximate size' }
        ]
      },
      {
        id: 'p2-2',
        title: 'A Garden That Fits - My Yard In Bloom',
        tasks: [
          { id: 't2-12', title: 'Decide what vegetables, herbs, and fruits to grow' },
          { id: 't2-13', title: 'Research the growing requirements for each plant' },
          { id: 't2-14', title: 'Determine which plants grow well together' },
          { id: 't2-15', title: 'Identify incompatible plant combinations' },
          { id: 't2-16', title: 'Determine spacing requirements' },
          { id: 't2-17', title: 'Calculate the number of plants the space can support' },
          { id: 't2-18', title: 'Create a garden layout' },
          { id: 't2-19', title: 'Determine where pathways should go' },
          { id: 't2-20', title: 'Design irrigation or watering zones' },
          { id: 't2-21', title: 'Plan locations for trellises and supports' },
          { id: 't2-22', title: 'Create a final planting map' }
        ]
      },
      {
        id: 'p2-3',
        title: 'Research and Study the Grow Calendar',
        tasks: [
          { id: 't2-23', title: 'Determine the local growing zone' },
          { id: 't2-24', title: 'Research the local last-frost date' },
          { id: 't2-25', title: 'Research the local first-frost date' },
          { id: 't2-26', title: 'Identify the appropriate planting window for each crop' },
          { id: 't2-27', title: 'Determine which crops should be started indoors' },
          { id: 't2-28', title: 'Determine which crops can be directly seeded' },
          { id: 't2-29', title: 'Determine succession-planting opportunities' },
          { id: 't2-30', title: 'Identify crops that can be harvested throughout the season' },
          { id: 't2-31', title: 'Build a planting calendar' },
          { id: 't2-32', title: 'Build an expected harvest calendar' }
        ]
      },
      {
        id: 'p2-4',
        title: 'Prepare And Assemble The Garden Space',
        tasks: [
          { id: 't2-33', title: 'Clear weeds and unwanted vegetation' },
          { id: 't2-34', title: 'Remove rocks and debris' },
          { id: 't2-35', title: 'Mark the garden boundaries' },
          { id: 't2-36', title: 'Establish pathways' },
          { id: 't2-37', title: 'Build or install garden beds' },
          { id: 't2-38', title: 'Improve soil drainage where necessary' },
          { id: 't2-39', title: 'Add compost or soil amendments' },
          { id: 't2-40', title: 'Till or loosen the soil where appropriate' },
          { id: 't2-41', title: 'Level the planting areas' },
          { id: 't2-42', title: 'Install edging or borders' },
          { id: 't2-43', title: 'Install fencing or pest barriers' }
        ]
      },
      {
        id: 'p2-5',
        title: 'Purchase Materials, Seeds, Plants, Etc',
        tasks: [
          { id: 't2-44', title: 'Create a complete materials list' },
          { id: 't2-45', title: 'Determine required quantities of soil amendments' },
          { id: 't2-46', title: 'Purchase compost' },
          { id: 't2-47', title: 'Purchase seeds' },
          { id: 't2-48', title: 'Purchase starter plants' },
          { id: 't2-49', title: 'Purchase gardening tools' },
          { id: 't2-50', title: 'Purchase plant supports' },
          { id: 't2-51', title: 'Purchase irrigation supplies' },
          { id: 't2-52', title: 'Purchase pest-control materials' },
          { id: 't2-53', title: 'Label and organize seeds and plants' }
        ]
      },
      {
        id: 'p2-6',
        title: 'It’s Finally Time To Plant!',
        tasks: [
          { id: 't2-54', title: 'Prepare planting rows or holes' },
          { id: 't2-55', title: 'Label planting locations' },
          { id: 't2-56', title: 'Start indoor seeds where necessary' },
          { id: 't2-57', title: 'Direct-sow appropriate crops' },
          { id: 't2-58', title: 'Transplant starter plants' },
          { id: 't2-59', title: 'Install plant supports' },
          { id: 't2-60', title: 'Water newly planted crops' },
          { id: 't2-61', title: 'Record planting dates' },
          { id: 't2-62', title: 'Establish a watering schedule' },
          { id: 't2-63', title: 'Monitor early germination' }
        ]
      },
      {
        id: 'p2-7',
        title: 'Maintain and Grow – Developing My Garden',
        tasks: [
          { id: 't2-64', title: 'Check soil moisture regularly' },
          { id: 't2-65', title: 'Water according to plant requirements' },
          { id: 't2-66', title: 'Remove competing weeds' },
          { id: 't2-67', title: 'Monitor plants for pests' },
          { id: 't2-68', title: 'Identify signs of disease' },
          { id: 't2-69', title: 'Apply appropriate organic amendments' },
          { id: 't2-70', title: 'Train climbing plants onto supports' },
          { id: 't2-71', title: 'Prune plants when appropriate' },
          { id: 't2-72', title: 'Replace failed plants' },
          { id: 't2-73', title: 'Record growth and harvest observations' }
        ]
      },
      {
        id: 'p2-8',
        title: 'Time To Harvest – Where To From Here?',
        tasks: [
          { id: 't2-74', title: 'Determine when each crop is ready to harvest' },
          { id: 't2-75', title: 'Establish harvesting routines' },
          { id: 't2-76', title: 'Record harvest quantities' },
          { id: 't2-77', title: 'Preserve excess produce' },
          { id: 't2-78', title: 'Identify the highest-performing crops' },
          { id: 't2-79', title: 'Identify crops that struggled' },
          { id: 't2-80', title: 'Document pest problems' },
          { id: 't2-81', title: 'Document soil and watering problems' },
          { id: 't2-82', title: 'Evaluate the garden layout' },
          { id: 't2-83', title: 'Create recommendations for next season' },
          { id: 't2-84', title: 'Save seeds where appropriate' },
          { id: 't2-85', title: 'Build next season’s planting plan' }
        ]
      }
    ]
  },
  {
    id: 'promo-agency',
    title: 'Start My Own Design Agency',
    description: 'Build a high-value design agency from branding and business foundation to sales, client delivery, and operations.',
    authorId: 'gonnng-agency',
    authorName: 'Agency Strategist',
    category: 'Entrepreneurship',
    tags: ['business', 'agency', 'design', 'entrepreneurship'],
    visibility: 'public',
    phases: [
      {
        id: 'p3-1',
        title: 'What Am I Building',
        tasks: [
          { id: 't3-1', title: 'Identify the type of design work the agency will provide' },
          { id: 't3-2', title: 'Determine the ideal client' },
          { id: 't3-3', title: 'Identify the industries the agency will target' },
          { id: 't3-4', title: 'Define the agency’s primary services' },
          { id: 't3-5', title: 'Determine which services will be packaged together' },
          { id: 't3-6', title: 'Identify the agency’s competitive advantage' },
          { id: 't3-7', title: 'Research competing design agencies' },
          { id: 't3-8', title: 'Compare competitor services and pricing' },
          { id: 't3-9', title: 'Identify gaps in the existing market' },
          { id: 't3-10', title: 'Write the agency’s positioning statement' },
          { id: 't3-11', title: 'Define the agency’s initial business model' }
        ]
      },
      {
        id: 'p3-2',
        title: 'The Brand, The Offer – The Agency',
        tasks: [
          { id: 't3-12', title: 'Choose the agency name' },
          { id: 't3-13', title: 'Research name availability' },
          { id: 't3-14', title: 'Develop the agency’s visual identity' },
          { id: 't3-15', title: 'Create the agency logo' },
          { id: 't3-16', title: 'Establish typography standards' },
          { id: 't3-17', title: 'Establish the agency color system' },
          { id: 't3-18', title: 'Write the agency’s positioning statement' },
          { id: 't3-19', title: 'Write the agency’s service descriptions' },
          { id: 't3-20', title: 'Create initial service packages' },
          { id: 't3-21', title: 'Define what each package includes' },
          { id: 't3-22', title: 'Establish starting prices' },
          { id: 't3-23', title: 'Define optional add-on services' }
        ]
      },
      {
        id: 'p3-3',
        title: 'A Foundation of Sorts',
        tasks: [
          { id: 't3-24', title: 'Determine the appropriate business structure' },
          { id: 't3-25', title: 'Research business registration requirements' },
          { id: 't3-26', title: 'Register the business' },
          { id: 't3-27', title: 'Obtain required licenses or permits' },
          { id: 't3-28', title: 'Create a business bank account' },
          { id: 't3-29', title: 'Set up bookkeeping' },
          { id: 't3-30', title: 'Establish an invoicing system' },
          { id: 't3-31', title: 'Research business insurance requirements' },
          { id: 't3-32', title: 'Create standard business contracts' },
          { id: 't3-33', title: 'Create a proposal template' },
          { id: 't3-34', title: 'Create a client agreement' },
          { id: 't3-35', title: 'Establish payment terms' },
          { id: 't3-36', title: 'Establish a project cancellation policy' }
        ]
      },
      {
        id: 'p3-4',
        title: 'Portfolio Work, Skills An Agency Can Sell',
        tasks: [
          { id: 't3-37', title: 'Audit existing design work' },
          { id: 't3-38', title: 'Select the strongest portfolio pieces' },
          { id: 't3-39', title: 'Identify missing portfolio categories' },
          { id: 't3-40', title: 'Create speculative projects for missing categories' },
          { id: 't3-41', title: 'Develop case studies for major projects' },
          { id: 't3-42', title: 'Document the design process behind each case study' },
          { id: 't3-43', title: 'Photograph or mock up finished work' },
          { id: 't3-44', title: 'Write project descriptions' },
          { id: 't3-45', title: 'Organize portfolio categories' },
          { id: 't3-46', title: 'Create a portfolio presentation' },
          { id: 't3-47', title: 'Obtain permission to display client work where necessary' }
        ]
      },
      {
        id: 'p3-5',
        title: 'Build A Client Experience',
        tasks: [
          { id: 't3-48', title: 'Map the client journey from inquiry to completion' },
          { id: 't3-49', title: 'Create an initial client inquiry form' },
          { id: 't3-50', title: 'Create a discovery questionnaire' },
          { id: 't3-51', title: 'Define the client onboarding process' },
          { id: 't3-52', title: 'Create a project kickoff checklist' },
          { id: 't3-53', title: 'Establish project milestones' },
          { id: 't3-54', title: 'Define the design-review process' },
          { id: 't3-55', title: 'Establish revision limits' },
          { id: 't3-56', title: 'Create client approval procedures' },
          { id: 't3-57', title: 'Establish project handoff requirements' },
          { id: 't3-58', title: 'Create a client offboarding process' },
          { id: 't3-59', title: 'Create a testimonial request process' }
        ]
      },
      {
        id: 'p3-6',
        title: 'Design and Develop A Sales Engine',
        tasks: [
          { id: 't3-60', title: 'Create the agency website' },
          { id: 't3-61', title: 'Create service landing pages' },
          { id: 't3-62', title: 'Publish the portfolio' },
          { id: 't3-63', title: 'Publish case studies' },
          { id: 't3-64', title: 'Create a contact page' },
          { id: 't3-65', title: 'Create a lead intake process' },
          { id: 't3-66', title: 'Identify potential client industries' },
          { id: 't3-67', title: 'Build an initial prospect list' },
          { id: 't3-68', title: 'Research individual prospects' },
          { id: 't3-69', title: 'Identify appropriate decision-makers' },
          { id: 't3-70', title: 'Develop an outreach message' },
          { id: 't3-71', title: 'Create a referral strategy' },
          { id: 't3-72', title: 'Establish a weekly prospecting target' }
        ]
      },
      {
        id: 'p3-7',
        title: 'Client ONE : Pitch, Land, and Deliver',
        tasks: [
          { id: 't3-73', title: 'Contact the first prospects' },
          { id: 't3-74', title: 'Follow up with interested prospects' },
          { id: 't3-75', title: 'Conduct discovery calls' },
          { id: 't3-76', title: 'Identify client problems and requirements' },
          { id: 't3-77', title: 'Prepare project proposals' },
          { id: 't3-78', title: 'Present proposals to prospective clients' },
          { id: 't3-79', title: 'Negotiate project scope' },
          { id: 't3-80', title: 'Secure the first client agreement' },
          { id: 't3-81', title: 'Collect the initial payment' },
          { id: 't3-82', title: 'Kick off the project' },
          { id: 't3-83', title: 'Deliver the first design concepts' },
          { id: 't3-84', title: 'Complete client revisions' },
          { id: 't3-85', title: 'Obtain final approval' },
          { id: 't3-86', title: 'Deliver final assets' }
        ]
      },
      {
        id: 'p3-8',
        title: 'Make What We Do a Repeatable Business',
        tasks: [
          { id: 't3-87', title: 'Review profitability of completed projects' },
          { id: 't3-88', title: 'Compare estimated versus actual project hours' },
          { id: 't3-89', title: 'Adjust service pricing' },
          { id: 't3-90', title: 'Identify the most profitable services' },
          { id: 't3-91', title: 'Identify the best-performing client types' },
          { id: 't3-92', title: 'Document repeatable workflows' },
          { id: 't3-93', title: 'Automate administrative tasks' },
          { id: 't3-94', title: 'Create reusable project templates' },
          { id: 't3-95', title: 'Develop recurring-service opportunities' },
          { id: 't3-96', title: 'Establish monthly revenue targets' },
          { id: 't3-97', title: 'Establish client-retention goals' },
          { id: 't3-98', title: 'Build a pipeline for the next quarter' }
        ]
      }
    ]
  },
  {
    id: 'promo-degree',
    title: 'Finish My Degree',
    description: 'Evaluate past academic credits, select an accelerated transfer pathway, complete coursework, and graduate.',
    authorId: 'gonnng-academic',
    authorName: 'Degree Navigator',
    category: 'Fine Art',
    tags: ['education', 'degree', 'academic', 'college'],
    visibility: 'public',
    phases: [
      {
        id: 'p4-1',
        title: 'Where Do I Stand, Academically Speaking',
        tasks: [
          { id: 't4-1', title: 'Obtain my current academic transcript' },
          { id: 't4-2', title: 'Verify every completed course' },
          { id: 't4-3', title: 'Identify remaining degree requirements' },
          { id: 't4-4', title: 'Identify outstanding general-education requirements' },
          { id: 't4-5', title: 'Identify outstanding major requirements' },
          { id: 't4-6', title: 'Identify outstanding electives' },
          { id: 't4-7', title: 'Check my current GPA' },
          { id: 't4-8', title: 'Check my credit-hour total' },
          { id: 't4-9', title: 'Identify expired or outdated credits' },
          { id: 't4-10', title: 'Identify academic requirements that have changed' },
          { id: 't4-11', title: 'Confirm my academic standing with the school' }
        ]
      },
      {
        id: 'p4-2',
        title: 'Where Can My Existing Credits Take Me',
        tasks: [
          { id: 't4-12', title: 'Research colleges offering the target degree' },
          { id: 't4-13', title: 'Compare degree requirements between schools' },
          { id: 't4-14', title: 'Research transfer-credit policies' },
          { id: 't4-15', title: 'Determine which of my credits are transferable' },
          { id: 't4-16', title: 'Request an official transfer-credit evaluation' },
          { id: 't4-17', title: 'Identify credits that transfer as direct equivalents' },
          { id: 't4-18', title: 'Identify credits that transfer only as electives' },
          { id: 't4-19', title: 'Identify credits that will not transfer' },
          { id: 't4-20', title: 'Research whether professional experience can count toward credits' },
          { id: 't4-21', title: 'Identify alternative credit options' },
          { id: 't4-22', title: 'Calculate my remaining credits after transfer' }
        ]
      },
      {
        id: 'p4-3',
        title: 'What Degree Programs Do My Credits Work With',
        tasks: [
          { id: 't4-23', title: 'Identify degree programs matching my career goals' },
          { id: 't4-24', title: 'Compare online degree programs' },
          { id: 't4-25', title: 'Compare local degree programs' },
          { id: 't4-26', title: 'Compare accelerated degree programs' },
          { id: 't4-27', title: 'Compare part-time degree programs' },
          { id: 't4-28', title: 'Compare tuition costs' },
          { id: 't4-29', title: 'Compare residency requirements' },
          { id: 't4-30', title: 'Compare remaining coursework' },
          { id: 't4-31', title: 'Compare graduation timelines' },
          { id: 't4-32', title: 'Compare accreditation' },
          { id: 't4-33', title: 'Compare transfer-credit acceptance' },
          { id: 't4-34', title: 'Create a shortlist of viable programs' }
        ]
      },
      {
        id: 'p4-4',
        title: 'What’s The Quickest Road To Graduation',
        tasks: [
          { id: 't4-35', title: 'Contact admissions offices' },
          { id: 't4-36', title: 'Ask each school for a degree audit' },
          { id: 't4-37', title: 'Confirm transfer-credit decisions' },
          { id: 't4-38', title: 'Compare remaining course requirements' },
          { id: 't4-39', title: 'Calculate the total remaining tuition' },
          { id: 't4-40', title: 'Calculate the earliest realistic graduation date' },
          { id: 't4-41', title: 'Determine whether summer courses are available' },
          { id: 't4-42', title: 'Determine whether courses can be taken concurrently' },
          { id: 't4-43', title: 'Determine whether prior learning can reduce requirements' },
          { id: 't4-44', title: 'Compare full-time and part-time schedules' },
          { id: 't4-45', title: 'Select the best degree-completion path' }
        ]
      },
      {
        id: 'p4-5',
        title: 'Complete Enrollment and Academic Preparation',
        tasks: [
          { id: 't4-46', title: 'Submit the application' },
          { id: 't4-47', title: 'Submit official transcripts' },
          { id: 't4-48', title: 'Complete financial-aid requirements' },
          { id: 't4-49', title: 'Resolve admissions requirements' },
          { id: 't4-50', title: 'Confirm transferred credits' },
          { id: 't4-51', title: 'Review the final degree audit' },
          { id: 't4-52', title: 'Meet with an academic advisor' },
          { id: 't4-53', title: 'Register for remaining courses' },
          { id: 't4-54', title: 'Purchase required textbooks and materials' },
          { id: 't4-55', title: 'Build a semester calendar' },
          { id: 't4-56', title: 'Establish weekly study blocks' },
          { id: 't4-57', title: 'Create a system for tracking degree progress' }
        ]
      },
      {
        id: 'p4-6',
        title: 'Complete the Remaining Coursework',
        tasks: [
          { id: 't4-58', title: 'Complete the first remaining course' },
          { id: 't4-59', title: 'Submit all required assignments' },
          { id: 't4-60', title: 'Complete required exams' },
          { id: 't4-61', title: 'Track grades throughout the semester' },
          { id: 't4-62', title: 'Complete the next required course' },
          { id: 't4-63', title: 'Review progress against the degree audit' },
          { id: 't4-64', title: 'Resolve academic issues early' },
          { id: 't4-65', title: 'Register for the next term' },
          { id: 't4-66', title: 'Complete major-specific requirements' },
          { id: 't4-67', title: 'Complete final elective requirements' },
          { id: 't4-68', title: 'Complete the final required course' }
        ]
      },
      {
        id: 'p4-7',
        title: 'Clear Every Requirement for Graduation',
        tasks: [
          { id: 't4-69', title: 'Request a final degree audit' },
          { id: 't4-70', title: 'Verify every required credit is complete' },
          { id: 't4-71', title: 'Resolve missing or incorrect credits' },
          { id: 't4-72', title: 'Confirm GPA requirements' },
          { id: 't4-73', title: 'Complete graduation application' },
          { id: 't4-74', title: 'Resolve outstanding administrative holds' },
          { id: 't4-75', title: 'Confirm financial obligations' },
          { id: 't4-76', title: 'Submit remaining academic paperwork' },
          { id: 't4-77', title: 'Confirm degree conferral date' },
          { id: 't4-78', title: 'Order graduation regalia if desired' },
          { id: 't4-79', title: 'Verify diploma delivery information' }
        ]
      },
      {
        id: 'p4-8',
        title: 'Chart This Degree Toward Career Progress',
        tasks: [
          { id: 't4-80', title: 'Update my résumé with the completed degree' },
          { id: 't4-81', title: 'Update my LinkedIn profile' },
          { id: 't4-82', title: 'Update my professional portfolio' },
          { id: 't4-83', title: 'Identify roles requiring the degree' },
          { id: 't4-84', title: 'Research salary ranges for those roles' },
          { id: 't4-85', title: 'Identify skill gaps for target positions' },
          { id: 't4-86', title: 'Update my professional summary' },
          { id: 't4-87', title: 'Apply to appropriate positions' },
          { id: 't4-88', title: 'Contact relevant professional connections' },
          { id: 't4-89', title: 'Identify opportunities for advancement' }
        ]
      }
    ]
  },
  {
    id: 'promo-french',
    title: 'Learn French Before My Honeymoon',
    description: 'Master practical conversational French, travel phrases, and local customs before taking off on your honeymoon.',
    authorId: 'gonnng-polyglot',
    authorName: 'Travel Linguist',
    category: 'Hobby',
    tags: ['french', 'language', 'travel', 'hobby'],
    visibility: 'public',
    phases: [
      {
        id: 'p5-1',
        title: 'How Much French Do I Actually Need',
        tasks: [
          { id: 't5-1', title: 'Determine where the honeymoon will take place' },
          { id: 't5-2', title: 'Identify the French-speaking situations I am likely to encounter' },
          { id: 't5-3', title: 'List essential travel conversations' },
          { id: 't5-4', title: 'Identify restaurant vocabulary I will need' },
          { id: 't5-5', title: 'Identify hotel vocabulary I will need' },
          { id: 't5-6', title: 'Identify transportation vocabulary I will need' },
          { id: 't5-7', title: 'Identify shopping vocabulary I will need' },
          { id: 't5-8', title: 'Identify emergency phrases I should know' },
          { id: 't5-9', title: 'Identify polite expressions used by locals' },
          { id: 't5-10', title: 'Define a realistic proficiency goal for the trip' },
          { id: 't5-11', title: 'Create a list of essential phrases' }
        ]
      },
      {
        id: 'p5-2',
        title: 'A Practical Language Foundation',
        tasks: [
          { id: 't5-12', title: 'Learn French pronunciation rules' },
          { id: 't5-13', title: 'Learn French greetings' },
          { id: 't5-14', title: 'Learn common introductions' },
          { id: 't5-15', title: 'Learn numbers' },
          { id: 't5-16', title: 'Learn days and months' },
          { id: 't5-17', title: 'Learn basic question words' },
          { id: 't5-18', title: 'Learn essential travel verbs' },
          { id: 't5-19', title: 'Learn common nouns' },
          { id: 't5-20', title: 'Learn basic adjectives' },
          { id: 't5-21', title: 'Learn essential prepositions' },
          { id: 't5-22', title: 'Learn basic sentence structure' },
          { id: 't5-23', title: 'Learn the most common conversational phrases' }
        ]
      },
      {
        id: 'p5-3',
        title: 'The Language of Travel, Together',
        tasks: [
          { id: 't5-24', title: 'Learn how to introduce myself and my spouse' },
          { id: 't5-25', title: 'Learn how to ask for directions' },
          { id: 't5-26', title: 'Learn how to understand basic directions' },
          { id: 't5-27', title: 'Learn how to order food' },
          { id: 't5-28', title: 'Learn how to ask about ingredients' },
          { id: 't5-29', title: 'Learn how to request the bill' },
          { id: 't5-30', title: 'Learn how to check into a hotel' },
          { id: 't5-31', title: 'Learn how to ask about hotel amenities' },
          { id: 't5-32', title: 'Learn how to purchase tickets' },
          { id: 't5-33', title: 'Learn how to use public transportation' },
          { id: 't5-34', title: 'Learn how to ask for help' },
          { id: 't5-35', title: 'Learn how to handle a basic emergency' }
        ]
      },
      {
        id: 'p5-4',
        title: 'Listening and Speaking Skills',
        tasks: [
          { id: 't5-36', title: 'Establish a daily French listening routine' },
          { id: 't5-37', title: 'Listen to beginner French conversations' },
          { id: 't5-38', title: 'Practice recognizing common spoken phrases' },
          { id: 't5-39', title: 'Repeat native-speaker sentences aloud' },
          { id: 't5-40', title: 'Practice French pronunciation' },
          { id: 't5-41', title: 'Record myself speaking French' },
          { id: 't5-42', title: 'Compare my pronunciation with native speakers' },
          { id: 't5-43', title: 'Practice introducing myself without notes' },
          { id: 't5-44', title: 'Practice ordering a complete meal' },
          { id: 't5-45', title: 'Practice asking and answering common questions' },
          { id: 't5-46', title: 'Complete weekly speaking sessions' }
        ]
      },
      {
        id: 'p5-5',
        title: 'Build French Around the Actual Honeymoon',
        tasks: [
          { id: 't5-47', title: 'Research the destinations we will visit' },
          { id: 't5-48', title: 'Identify cities and landmarks we will encounter' },
          { id: 't5-49', title: 'Learn the names of important destinations' },
          { id: 't5-50', title: 'Learn phrases specific to our itinerary' },
          { id: 't5-51', title: 'Research common restaurant customs' },
          { id: 't5-52', title: 'Learn French dining etiquette' },
          { id: 't5-53', title: 'Learn appropriate greetings and polite expressions' },
          { id: 't5-54', title: 'Learn how to interact with hotel staff' },
          { id: 't5-55', title: 'Learn transportation-specific vocabulary' },
          { id: 't5-56', title: 'Build a destination-specific phrasebook' },
          { id: 't5-57', title: 'Practice conversations based on our actual itinerary' }
        ]
      },
      {
        id: 'p5-6',
        title: 'Real-World Conversations, Practice Makes Perfect',
        tasks: [
          { id: 't5-58', title: 'Practice ordering breakfast' },
          { id: 't5-59', title: 'Practice ordering dinner' },
          { id: 't5-60', title: 'Practice checking into a hotel' },
          { id: 't5-61', title: 'Practice asking for directions' },
          { id: 't5-62', title: 'Practice buying something in a shop' },
          { id: 't5-63', title: 'Practice purchasing transportation tickets' },
          { id: 't5-64', title: 'Practice asking a stranger for help' },
          { id: 't5-65', title: 'Practice making a reservation' },
          { id: 't5-66', title: 'Practice explaining a simple problem' },
          { id: 't5-67', title: 'Practice having a five-minute conversation' },
          { id: 't5-68', title: 'Practice conversations without translating every sentence' }
        ]
      },
      {
        id: 'p5-7',
        title: 'Immersion, Fluency From Exposure',
        tasks: [
          { id: 't5-69', title: 'Set a daily French study schedule' },
          { id: 't5-70', title: 'Complete daily vocabulary practice' },
          { id: 't5-71', title: 'Listen to French while commuting' },
          { id: 't5-72', title: 'Watch French videos with subtitles' },
          { id: 't5-73', title: 'Read simple French text' },
          { id: 't5-74', title: 'Practice speaking French every day' },
          { id: 't5-75', title: 'Replace common English phrases with French equivalents' },
          { id: 't5-76', title: 'Keep a French vocabulary journal' },
          { id: 't5-77', title: 'Review previously learned vocabulary' },
          { id: 't5-78', title: 'Track words and phrases I can use without translation' },
          { id: 't5-79', title: 'Complete weekly conversational practice' }
        ]
      },
      {
        id: 'p5-8',
        title: 'Check Honeymoon Readiness',
        tasks: [
          { id: 't5-80', title: 'Conduct a French-only restaurant simulation' },
          { id: 't5-81', title: 'Conduct a French-only hotel check-in simulation' },
          { id: 't5-82', title: 'Conduct a transportation simulation' },
          { id: 't5-83', title: 'Practice asking for directions' },
          { id: 't5-84', title: 'Practice handling a misunderstanding' },
          { id: 't5-85', title: 'Practice explaining a basic problem' },
          { id: 't5-86', title: 'Practice introducing myself and my spouse' },
          { id: 't5-87', title: 'Complete a 10-minute conversation' },
          { id: 't5-88', title: 'Identify vocabulary I still struggle to recall' },
          { id: 't5-89', title: 'Review the most important phrases' },
          { id: 't5-90', title: 'Create a compact travel phrase sheet' },
          { id: 't5-91', title: 'Practice the phrase sheet until recall is automatic' }
        ]
      }
    ]
  }
];

export interface RecipePromoObjectProps {
  recipe: Recipe;
  isSaved?: boolean;
  onToggleSave?: (recipeId: string, recipe: Recipe) => void;
  onOpenRecipe: (recipe: Recipe) => void;
  onStartProject?: (recipe: Recipe) => void;
  rotation?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function RecipePromoObject({
  recipe,
  isSaved = false,
  onToggleSave,
  onOpenRecipe,
  onStartProject,
  rotation = 0,
  className = '',
  style = {}
}: RecipePromoObjectProps) {
  const colors = getCategoryColorCollection(recipe.category);

  return (
    <div
      onClick={() => onOpenRecipe(recipe)}
      style={{
        backgroundColor: colors.ultraLight,
        transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
        ...style
      }}
      className={`w-[260px] sm:w-[280px] h-[500px] rounded-[24px] shadow-xl border border-black/10 overflow-hidden flex flex-col relative shrink-0 cursor-pointer select-none transition-all duration-300 ease-out hover:scale-105 hover:z-50 hover:shadow-2xl hover:rotate-0 group ${className}`}
    >
      {/* HEADER BANNER: ONLY Category Badge + Bookmark Icon Only Button */}
      <div
        className="w-full p-[12px] flex items-center justify-between gap-2 border-b border-black/5 shrink-0"
        style={{ backgroundColor: colors.light }}
      >
        <div className="min-w-0">
          <CategoryBadge category={recipe.category || 'General'} collection={colors} />
        </div>

        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {isSaved ? (
            <IconOnlyTileButton
              icon={Bookmark}
              onClick={() => onToggleSave?.(recipe.id, recipe)}
              collection={COLOR_COLLECTIONS['Gonnng Gold']}
              title="Saved in Library"
            />
          ) : (
            <IconOnlySubButton
              icon={Bookmark}
              onClick={() => onToggleSave?.(recipe.id, recipe)}
              collection={colors}
              title="Save to Library"
            />
          )}
        </div>
      </div>

      {/* BODY: Title, Author, Description, Phases & Tasks (SCROLL LOCKED / overflow-hidden) */}
      <div className="flex-1 overflow-hidden p-4 space-y-3 pointer-events-none">
        {/* Title */}
        <h3 className="text-base font-display font-bold text-gray-900 leading-tight line-clamp-2">
          {recipe.title}
        </h3>

        {/* Creator / Metadata */}
        <div className="text-[11px] font-mono text-gray-500 truncate">
          by @{recipe.authorName || 'Gonnng Studio'}
        </div>

        {/* Description */}
        {recipe.description && (
          <p className="text-xs font-sans text-gray-600 line-clamp-2 leading-relaxed">
            {recipe.description}
          </p>
        )}

        {/* Phase & Task Blueprint List (Locked/Non-scrollable) */}
        <div className="space-y-2 pt-1 overflow-hidden">
          {recipe.phases && recipe.phases.slice(0, 3).map((phase, pIdx) => {
            const tasks = phase.tasks || [];
            return (
              <div
                key={`promo-mini-${recipe.id || 'rec'}-ph-${phase.id || pIdx}-${pIdx}`}
                className="rounded-xl border border-black/10 p-2.5 space-y-1.5 shadow-2xs"
                style={{ backgroundColor: colors.soft }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-700 shrink-0" />
                    <span className="font-bold text-xs text-gray-900 truncate">
                      {phase.title}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] font-semibold text-gray-500 shrink-0">
                    {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                </div>

                {/* Task items */}
                <div className="space-y-1 pt-0.5">
                  {tasks.slice(0, 2).map((task, tIdx) => (
                    <div
                      key={`promo-mini-${recipe.id || 'rec'}-t-${task.id || tIdx}-${pIdx}-${tIdx}`}
                      className="px-2 py-1 rounded-lg border border-black/5 bg-white/80 text-[11px] font-sans text-gray-800 truncate flex items-center gap-1.5"
                    >
                      <span className="text-emerald-600 font-mono text-[10px] shrink-0">✓</span>
                      <span className="truncate">{task.title || 'Task item'}</span>
                    </div>
                  ))}
                  {tasks.length > 2 && (
                    <div className="text-[10px] font-mono text-gray-500 px-1 pt-0.5">
                      +{tasks.length - 2} more tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FOOTER: ONLY Start Project Button */}
      <div 
        className="p-3 border-t border-black/10 bg-white/90 backdrop-blur-md flex items-center justify-center w-full shrink-0 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <IconWithLabelButton
          variant="primary"
          icon={BookPlus}
          label="START PROJECT"
          onClick={() => onStartProject?.(recipe)}
          title="Start Project from Recipe"
        />
      </div>
    </div>
  );
}

function shuffleRecipes<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface RecipePromoBlockProps {
  recipes?: Recipe[];
  savedRecipeIds?: string[];
  onToggleSaveRecipe?: (recipeId: string, recipeObj?: Recipe) => void;
  onOpenRecipeModal: (recipe: Recipe) => void;
  onStartProject?: (recipe: Recipe) => void;
}

export function RecipePromoBlock({
  savedRecipeIds = [],
  onToggleSaveRecipe,
  onOpenRecipeModal,
  onStartProject
}: RecipePromoBlockProps) {
  // Always return 5 randomized recipes strictly from PROMO_RECIPES in code
  const [displayRecipes] = useState<Recipe[]>(() => {
    return shuffleRecipes(PROMO_RECIPES).slice(0, 5);
  });

  // Exact desktop angles specified:
  // Center (idx 2): +6 deg
  // Just left (idx 1): -12 deg
  // Farthest left (idx 0): -32 deg
  // Just right (idx 3): +18 deg
  // Farthest right (idx 4): +42 deg
  const DESKTOP_ROTATIONS = [-32, -12, 6, 18, 42];
  const DESKTOP_Z_INDEX = [10, 20, 30, 20, 10];
  const DESKTOP_TRANSLATE_X = [-220, -110, 0, 110, 220];
  const DESKTOP_TRANSLATE_Y = [24, 10, -8, 10, 28];

  const [activeIndex, setActiveIndex] = useState(2); // Center card active by default

  const handlePrev = () => {
    setActiveIndex(prev => (prev > 0 ? prev - 1 : displayRecipes.length - 1));
  };

  const handleNext = () => {
    setActiveIndex(prev => (prev < displayRecipes.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="w-full py-8 space-y-4 my-4 overflow-visible">
      {/* Header Label */}
      <div className="text-center space-y-1.5 px-4" style={{ marginBottom: '42px', paddingLeft: '18px' }}>
        <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight inline-flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#D97706]" />
          <span>Recipes to Explore</span>
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed font-sans">
          Explore more ways to get things done. Follow someone else's path, make it your own, or create a new one from scratch. Gonnng helps you discover how people turn big ideas into real-world results—and gives you the tools to do it your way.
        </p>

      </div>

      {/* DESKTOP / TABLET FAN LAYOUT (md:flex) */}
      <div className="hidden md:flex relative justify-center items-center h-[540px] w-full max-w-6xl mx-auto overflow-visible py-4">
        {displayRecipes.map((recipe, idx) => {
          const rotation = DESKTOP_ROTATIONS[idx] ?? 0;
          const zIdx = DESKTOP_Z_INDEX[idx] ?? 10;
          const translateX = DESKTOP_TRANSLATE_X[idx] ?? 0;
          const translateY = DESKTOP_TRANSLATE_Y[idx] ?? 0;
          const isSaved = savedRecipeIds.includes(recipe.id);

          return (
            <div
              key={`promo-desktop-recipe-${recipe.id || idx}-${idx}`}
              style={{
                position: 'absolute',
                zIndex: zIdx,
                transform: `translateX(${translateX}px) translateY(${translateY}px)`
              }}
              className="transition-transform duration-300 ease-out"
            >
              <RecipePromoObject
                recipe={recipe}
                rotation={rotation}
                isSaved={isSaved}
                onToggleSave={onToggleSaveRecipe}
                onOpenRecipe={onOpenRecipeModal}
                onStartProject={onStartProject}
              />
            </div>
          );
        })}
      </div>

      {/* MOBILE CAROUSEL LAYOUT (md:hidden) */}
      <div className="md:hidden relative w-full max-w-[340px] mx-auto px-2 py-4 flex items-center justify-center min-h-[530px] overflow-hidden">
        {/* Navigation Chevrons */}
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-0 z-40 p-2.5 rounded-full bg-white/95 border border-black/15 shadow-lg text-gray-900 hover:bg-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
          aria-label="Previous Recipe"
        >
          <ChevronLeft className="w-5 h-5 text-gray-900" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="absolute right-0 z-40 p-2.5 rounded-full bg-white/95 border border-black/15 shadow-lg text-gray-900 hover:bg-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
          aria-label="Next Recipe"
        >
          <ChevronRight className="w-5 h-5 text-gray-900" />
        </button>

        {/* Mobile Active Card Carousel */}
        <div className="relative w-full flex items-center justify-center">
          <AnimatePresence mode="wait">
            {displayRecipes.map((recipe, idx) => {
              if (idx !== activeIndex) return null;
              const isSaved = savedRecipeIds.includes(recipe.id);

              return (
                <motion.div
                  key={`promo-mobile-recipe-${recipe.id || idx}-${idx}`}
                  initial={{ opacity: 0, scale: 0.9, x: 40, rotate: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -40, rotate: -10 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="z-30"
                >
                  <RecipePromoObject
                    recipe={recipe}
                    rotation={0}
                    isSaved={isSaved}
                    onToggleSave={onToggleSaveRecipe}
                    onOpenRecipe={onOpenRecipeModal}
                    onStartProject={onStartProject}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Dot Indicators */}
      <div className="flex items-center justify-center gap-2 md:hidden pt-1">
        {displayRecipes.map((_, idx) => (
          <button
            key={`promo-mobile-dot-${idx}`}
            type="button"
            onClick={() => setActiveIndex(idx)}
            className={`h-2 rounded-full transition-all cursor-pointer ${
              activeIndex === idx ? 'w-6 bg-[#F59E0B]' : 'w-2 bg-gray-300'
            }`}
            aria-label={`Go to recipe ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
