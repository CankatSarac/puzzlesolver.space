import type {Metadata} from 'next';
import {LearningLibrary} from '@/learning/LearningLibrary';
export const metadata:Metadata={title:'Learn one puzzle deduction | PuzzleSolver',description:'Original worked rules for Tango, Battleship, Skyscraper and Slitherlink, in English and Turkish.'};
export default function Page(){return <LearningLibrary/>;}
