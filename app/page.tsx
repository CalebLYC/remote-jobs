import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";

export default async function Home() {
  const prisma = new PrismaClient();
  const jobs = await prisma.jobs.findMany({
    where: {
      date: {
        //today minus one day
        gte: new Date(new Date().setDate(new Date().getDate() - 1)),
      },
    }
  });

  console.log(jobs);

  return (
    <div className="flex flex-col gap-4 max-w-4xl m-auto">
      <h1 className="font-extrabold text-transparent text-8xl bg-clip-text bg-gradient-to-tr from-purple-400 to-pink-600">RemoteJobsFinder</h1>
      <ul className="flex flex-col gap-2">
        {
          jobs.map((job) =>
            <li key={job.id}>
              <Link href={job.url}>
                <Card className="hover:bg-muted/50">
                  <CardHeader className="flex flex-row gap-4">
                    <div>
                      <Avatar>
                        <AvatarFallback>{job.company ? job.company[0] : null}</AvatarFallback>
                        {
                          job.logo ? (
                            <AvatarImage src={job.logo} />
                          ) : null
                        }
                      </Avatar>
                    </div>
                    <div className="flex flex-col gap-2">
                      <CardTitle>{job.title}</CardTitle>
                      <CardDescription>{`${job.company} (${job.location})`}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent> </CardContent>
                </Card>
              </Link>
            </li>
          )
        }
      </ul>
    </div>
  );
}
