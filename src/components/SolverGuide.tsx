import { SITE } from '@/data/site';

const guides = {
  tango: {
    name: 'Tango',
    description: 'Enter suns, moons and the equality or difference markers from your puzzle. For a standard even-sized grid, each row and column must contain equal numbers of suns and moons, and three identical symbols cannot be consecutive.',
    example: 'In a six-cell row containing Sun, Sun, Moon, Sun, Moon, blank, the last cell must be Moon to make three of each symbol. Column rules and any equality markers must still agree; this single row does not determine the entire puzzle.',
    question: 'How do I enter a Tango puzzle?',
    answer: 'Choose the matching grid size, copy the given symbols, then set the equal/different markers between the appropriate cells. Leave unknown cells blank before solving.',
  },
  battleship: {
    name: 'Battleship / Bimaru',
    description: 'Copy the row and column ship-cell totals and any known water or ship clues into the Battleship grid. The totals count occupied cells, not the number of individual ships.',
    example: 'A row clue of 0 means every cell in that row is water. A row clue of 3 means exactly three cells are occupied; it does not by itself say whether they form one ship or several ships. Use column and fleet constraints as well.',
    question: 'What does a Battleship row clue mean?',
    answer: 'It gives the number of occupied ship cells in that row. Match the grid dimensions and enter every known clue before solving; a missing or contradictory clue can change the available completions.',
  },
  skyscraper: {
    name: 'Skyscraper',
    description: 'Enter the edge visibility clues and any given heights. Each row and column uses each height once. When looking from an edge, a taller building hides shorter buildings behind it.',
    example: 'For the row 1, 2, 3, 4, the clue from the left is 4 because every building is visible. From the right it is 1 because the height-4 building hides the rest. That row must also satisfy the crossing column clues.',
    question: 'How do Skyscraper visibility clues work?',
    answer: 'Count a building only when it is taller than every building before it from the viewing edge. Enter the clue on the side it belongs to; reversing left and right can make a valid puzzle appear contradictory.',
  },
  slitherlink: {
    name: 'Slitherlink',
    description: 'Enter the numbers inside the cells. Draw a single closed loop along the grid edges: a number tells you exactly how many of that cell’s four edges belong to the loop. The loop cannot branch or cross itself.',
    example: 'A cell marked 0 has no loop edges around it. A cell marked 3 has exactly three loop edges. Satisfying an individual cell is not enough: the selected edges must also connect into one loop across the whole grid.',
    question: 'What do the numbers in Slitherlink mean?',
    answer: 'Each number is the required count of loop edges around its cell, from 0 to 3. Keep cells with no printed clue blank; a blank cell is not the same as a 0 clue.',
  },
} as const;

export function SolverGuide({ kind }: { kind: keyof typeof guides }) {
  const guide=guides[kind];
  const url=`${SITE.url}/${kind}`;
  const app={
    '@context':'https://schema.org', '@type':'WebApplication',
    '@id':`${url}#application`, name:`${guide.name} Puzzle Solver`, url,
    applicationCategory:'GameApplication', operatingSystem:'Any modern web browser',
    browserRequirements:'JavaScript enabled', description:guide.description,
    isAccessibleForFree:true, author:{'@type':'Person',name:SITE.author},
  };
  return <section lang="en" className="mx-auto max-w-4xl px-6 py-16" aria-labelledby={`${kind}-guide`}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(app).replace(/</g,'\\u003c')}} />
    <h2 id={`${kind}-guide`} className="mb-6 text-2xl font-semibold">How to use the {guide.name} solver</h2>
    <p className="mb-6 leading-7">{guide.description}</p>
    <h3 className="mb-2 text-lg font-semibold">A worked rule example</h3><p className="mb-6 leading-7">{guide.example}</p>
    <h3 className="mb-2 text-lg font-semibold">{guide.question}</h3><p className="mb-6 leading-7">{guide.answer}</p>
    <h3 className="mb-2 text-lg font-semibold">What if the solver finds no solution?</h3><p className="mb-6 leading-7">Check the grid size, clue positions and copied values. Contradictory clues may have no completion. A returned grid is a completion, not automatically a proof of uniqueness; use any solution-count information shown by the tool and check the original puzzle’s rules.</p>
    <p className="leading-7">Grids are solved in your browser. Try another <a className="underline" href="/">logic puzzle solver</a> for a different puzzle type.</p>
  </section>;
}
