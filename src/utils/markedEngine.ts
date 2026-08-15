import { Phase, RecipePhase, Task } from '../types';

export interface ParseResult {
  title: string;
  phases: Phase[];
  warnings: string[];
}

export interface SerializeInput {
  title: string;
  description?: string;
  phases: (Phase | RecipePhase)[];
}

/**
 * Serializes structured Recipe / Project data into Marked markdown text format.
 */
export function serializeToMarked(data: SerializeInput): string {
  const parts: string[] = [];

  // Recipe / Project Title
  const title = (data.title || 'Untitled').trim();
  parts.push(`# ${title}`);

  if (data.description && data.description.trim()) {
    parts.push(data.description.trim());
  }

  parts.push(''); // blank line

  const phases = data.phases || [];
  phases.forEach((phase, pIdx) => {
    const phaseTitle = (phase.title || `Phase ${pIdx + 1}`).trim();
    parts.push(`## ${phaseTitle}`);
    parts.push('');

    const tasks = phase.tasks || [];
    tasks.forEach((task, tIdx) => {
      const taskTitle = (task.title || `Task ${tIdx + 1}`).trim();
      parts.push(`### ${taskTitle}`);

      if (task.body_markdown && task.body_markdown.trim()) {
        parts.push(task.body_markdown.trim());
      }
      parts.push('');
    });
  });

  return parts.join('\n').trim() + '\n';
}

/**
 * Parses Marked markdown text into structured Title and Phases/Tasks, returning user warnings.
 */
export function parseMarkedText(text: string, existingTitle?: string): ParseResult {
  const warnings: string[] = [];
  const lines = text.split(/\r?\n/);

  let title = '';
  let mainTitleFound = false;
  const phases: Phase[] = [];

  let currentPhase: Phase | null = null;
  let currentTask: Task | null = null;

  const preambleLines: string[] = [];

  const finalizeTask = () => {
    if (currentTask && currentPhase) {
      if (currentTask.body_markdown) {
        currentTask.body_markdown = currentTask.body_markdown.trim();
      }
      currentPhase.tasks.push(currentTask);
      currentTask = null;
    }
  };

  const finalizePhase = () => {
    finalizeTask();
    if (currentPhase) {
      phases.push(currentPhase);
      currentPhase = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmedLine = rawLine.trim();

    // 1. MAIN TITLE (# Text)
    if (/^#\s+/.test(trimmedLine)) {
      const extractedTitle = trimmedLine.replace(/^#\s+/, '').trim();
      if (!mainTitleFound) {
        title = extractedTitle;
        mainTitleFound = true;
      } else {
        warnings.push(
          `Multiple recipe titles (#) detected. Title '${extractedTitle}' was ignored in favor of primary title '${title}'.`
        );
      }
      continue;
    }

    // 2. PHASE HEADER (## Text)
    if (/^##\s+/.test(trimmedLine)) {
      const phaseTitle = trimmedLine.replace(/^##\s+/, '').trim();

      if (!mainTitleFound) {
        title = existingTitle || '(Untitled)';
        mainTitleFound = true;
        warnings.push(
          `Phase '${phaseTitle}' was found before a main title (#). Auto-created title '${title}'.`
        );
      }

      finalizePhase();

      currentPhase = {
        id: `ph-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: phaseTitle,
        tasks: []
      };
      continue;
    }

    // 3. TASK HEADER (### Text)
    if (/^###\s+/.test(trimmedLine)) {
      const taskTitle = trimmedLine.replace(/^###\s+/, '').trim();

      if (!currentPhase) {
        if (!mainTitleFound) {
          title = existingTitle || '(Untitled)';
          mainTitleFound = true;
          warnings.push(
            `Task '${taskTitle}' was found before a main title (#). Auto-created title '${title}'.`
          );
        }

        warnings.push(
          `Task '${taskTitle}' was found before any Phase header (##). Auto-created parent phase '(Untitled Phase)'.`
        );

        currentPhase = {
          id: `ph-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: '(Untitled Phase)',
          tasks: []
        };
      }

      finalizeTask();

      currentTask = {
        id: `tk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: taskTitle,
        completed: false,
        body_markdown: ''
      };
      continue;
    }

    // 4. NON-HEADER LINES (Body content)
    if (currentTask) {
      if (currentTask.body_markdown) {
        currentTask.body_markdown += '\n' + rawLine;
      } else {
        currentTask.body_markdown = rawLine;
      }
    } else if (currentPhase) {
      if (trimmedLine.length > 0) {
        // Text under Phase before any Task
        warnings.push(
          `Unassigned text under Phase '${currentPhase.title}' ("${trimmedLine.substring(0, 30)}...") was assigned to an auto-created Task 'Overview'.`
        );
        currentTask = {
          id: `tk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: 'Overview',
          completed: false,
          body_markdown: rawLine
        };
      }
    } else {
      if (trimmedLine.length > 0) {
        preambleLines.push(trimmedLine);
      }
    }
  }

  finalizePhase();

  if (preambleLines.length > 0) {
    warnings.push(
      `Preamble text found before any headers ("${preambleLines[0].substring(0, 35)}...") has no structural home and was not assigned to a task.`
    );
  }

  return {
    title: title || existingTitle || '(Untitled)',
    phases,
    warnings
  };
}
