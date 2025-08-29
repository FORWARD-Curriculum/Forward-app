import { ArrowRight, BookOpen, Target, Users } from "lucide-react";
import type { Route } from "./+types/home";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "FORWARD" },
    { name: "description", content: "Welcome to FORWARD Curriculum!" },
  ];
}

export default function Home() {
  return (
    <div className='w-full flex items-center justify-center bg-gradient-to-br from-accent/10 to-accent/5 relative overflow-hidden'>
      
      <div className='text-center px-6 max-w-4xl mx-auto relative z-10'>
        
        <h1 className="text-6xl font-black text-transparent bg-gradient-to-r from-secondary-foreground via-secondary-foreground to-muted-foreground bg-clip-text leading-tight mb-6 tracking-tight">
          FORWARD
          <span className="block text-6xl font-bold text-accent mt-2">
            CURRICULUM
          </span>
        </h1>
        
        {/* again to logo???*/}
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
          A comprehensive transition curriculum for alternative settings and circumstances
        </p>
        
        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <Link 
            prefetch="intent" 
            to={"/dashboard"} 
            className="group bg-accent hover:brightness-85 text-primary-foreground px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
          >
            Start Here
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
            prefetch="intent"
            to={"/supportersOfYouth"}
            className="bg-secondary/80 backdrop-blur-sm text-secondary-foreground px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 border border-secondary-border hover:border-muted-foreground shadow-sm hover:shadow-md">
            Learn More
          </Link>
        </div>
        
        <div className="flex gap-6 max-w-2xl mx-auto justify-center">
          <div className="bg-secondary/60 backdrop-blur-sm p-6 rounded-2xl border border-secondary-border shadow-sm hover:shadow-md transition-all duration-300 group flex-1">
            <BookOpen className="w-8 h-8 mb-3 mx-auto group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-secondary-foreground mb-2">Research & Evidence Based</h3>
            {/* <p className="text-sm text-muted-foreground">Step-by-step guidance for sustainable progress</p> */}
          </div>
          <div className="bg-secondary/60 backdrop-blur-sm p-6 rounded-2xl border border-secondary-border shadow-sm hover:shadow-md transition-all duration-300 group flex-1">
            <Target className="w-8 h-8 mb-3 mx-auto group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-secondary-foreground mb-2">Universal Design for Transition</h3>
            {/* <p className="text-sm text-muted-foreground">Clear milestones and measurable outcomes</p> */}
          </div>
        </div>
      </div>
    </div>
  );
}