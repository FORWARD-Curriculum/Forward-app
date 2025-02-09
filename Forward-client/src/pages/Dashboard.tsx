import { ReactNode, useState } from 'react'
import { ChevronDown, ChevronUp, Expand, FileVolume } from 'lucide-react';
import Pie from '../components/progress';

interface Lesson {
  name: string;
  description: string;
  image: string;
  progress: number;
}

function LessonCard(props: { lesson?: Lesson, children?: ReactNode }) {
  return <div className='bg-gray-100 rounded-2xl pt-3'>
    <div className='flex gap-4 items-center mx-4 pb-3'>
      <img src={props.lesson?.image} className='h-full max-w-20'></img>
      <div className='flex flex-col text-left'>
        <h1 className=' text-amber-500 text-xl'>{props.lesson?.name}</h1>
        <p>{props.lesson?.description}</p>
      </div>
      <div className='flex flex-col gap-2 ml-30 h-full'>
        <Expand />
        <FileVolume />
      </div>
    </div>
    {props.children}
  </div>
}

function Accordion(props:{children?: ReactNode}) {
  const [open, setOpen] = useState(false);
  return <div className='flex flex-col'>
    {open && <div>
      {props.children}
    </div>}
    <div className='bg-gray-200/50 border-t-1 border-gray-200 rounded-b-2xl flex justify-end px-4 items-center gap-1.5 py-0.5'>

      <button className=' text-sm' onClick={() => setOpen(!open)}>View</button>
      {open?<ChevronUp />:<ChevronDown/>}
    </div>
    
  </div>
}


export default function Dashboard({ className = "" }: { className?: string }) {
  const lessons: Lesson[] = [
    {
      name: "Going to College",
      description: "This lesson is a guide to navigating the path to higher education. You'll learn about different tupes of colleges, degrees, so you can decide what's right for you.",
      image: "/public/grad_cap.png",
      progress: 100,
    },
    {
      name: "Introduction to Soft Skills",
      description: "This lesson focuses on understanding and enhancing soft skills-personal attributes that enable individuals to interact effectively and harmoniously with others.",
      image: "/public/tools.png",
      progress: 30,
    },
    {
      name: "Personal Finance Management",
      description: "In this lesson learn the basics of managing money, including the differencebetween debit and credit, strategies to avoid debt, and creating a monthly budget.",
      image: "/public/money.png",
      progress: 0,
    }
  ]

  return (
    <><div className={className ? className : ""}>
      <div className='flex gap-3 w-full text-sm mb-4'>
        <p>Filter By:</p>
        <button className='bg-white text-center px-8 rounded-md drop-shadow-xs'>Recent</button>
        <button className='bg-white text-center px-8 rounded-md drop-shadow-xs'>Date</button>
        <button className='bg-white text-center px-8 rounded-md drop-shadow-xs'>Type</button>
      </div>
      <div className='grid grid-cols-12'>
        <div className="col-span-8">
          <div className='bg-white rounded-3xl p-4 flex flex-col gap-2 mr-4'>
            <h1 className='font-medium text-3xl text-left'>Lessons</h1>
            {lessons.map((e) => (
              <LessonCard lesson={e} >
                <Accordion>
                  This has been left undesigned as the API we need to build out will dictate how each lesson will be passed into the frontend. 
                  For the sake of showing off the footer's positioning, have some standard text: <br/><br/>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </Accordion>
              </LessonCard>
            ))}
          </div>
        </div>
        <div className="col-span-4 flex flex-col">
          <div className='bg-white rounded-3xl p-4 flex items-center gap-3 h-fit w-full'>
            <img src='/public/pfp.png' className='max-w-16' />
            <div className='text-left'>
              <h3 className='text-lg'>Sam Meyers</h3>
              <p className='text-sm text-gray-400'>ChillSam08</p>
            </div>
            <button className='ml-auto'>Edit</button>
          </div>
          <div >
            <p className='font-medium text-left'>Your Progress</p>
            <div className='col-start-2 col-end-2 bg-white rounded-3xl p-4'>
              {lessons.map((e) => (
                <div className='flex items-center'>
                  <Pie size={120} percentage={e.progress} color="orange" />
                  <h2>{e.name}</h2>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}