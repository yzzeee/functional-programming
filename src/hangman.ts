import {
  constFalse,
  constTrue,
  constUndefined,
  flow,
  pipe
} from 'fp-ts/function'
import * as IO from 'fp-ts/IO'
import * as S from 'fp-ts/string'
import * as O from 'fp-ts/Option'
import { randomInt } from 'fp-ts/Random'
import * as RA from 'fp-ts/ReadonlyArray'
import * as T from 'fp-ts/Task'
import { getLine, putStrLn } from './Console'

interface State {
  readonly name: string
  readonly guesses: ReadonlyArray<string>
  readonly word: ReadonlyArray<string>
}

const newState = (name: string, word: string): State => ({
  name,
  word: word.split(''),
  guesses: []
})

const addGuess = (state: State, guess: string): State => ({
  ...state,
  guesses: pipe(state.guesses, RA.snoc(guess))
})

const difference = RA.difference(S.Eq)

const failures = (state: State): number =>
  pipe(state.guesses, difference(state.word)).length

const playerLost = (state: State): boolean => failures(state) > 10

const playerWon = (state: State): boolean =>
  pipe(state.word, difference(state.guesses)).length === 0

const question = (question: string): T.Task<string> =>
  pipe(
    putStrLn(question),
    T.chain(() => getLine)
  )

const getName: T.Task<string> = question('What is your name:')

const parseGuess = (s: string): O.Option<string> => {
  const out = s.toLowerCase().trim()
  return out.length === 1 ? O.some(out) : O.none
}

const getGuess: T.Task<string> = pipe(
  question('Please enter a letter:'),
  T.chain(
    flow(
      parseGuess,
      O.match(() => getGuess, T.of)
    )
  )
)

const dictionary: ReadonlyArray<string> = getDictionary()

const randomElem = <A>(as: ReadonlyArray<A>): IO.IO<A> =>
  pipe(
    randomInt(0, as.length - 1),
    IO.map((i) => as[i])
  )

const chooseWord: T.Task<string> = pipe(dictionary, randomElem, T.fromIO)

const render = (state: State) => {
  const word = state.word
    .map((c) => (state.guesses.includes(c) ? ` ${c} ` : '   '))
    .join('')
  const line = state.word.map(() => ' - ').join('')
  const guesses = ` Guesses: ${state.guesses.join(', ')}`
  return putStrLn(word + '\n' + line + '\n\n' + guesses + '\n')
}

const doLoop = (state: State, guess: string): T.Task<boolean> => {
  if (playerWon(state)) {
    return pipe(
      putStrLn(`Congratulations ${state.name} you won the game!`),
      T.map(constFalse)
    )
  } else if (playerLost(state)) {
    return pipe(
      putStrLn(
        `Sorry ${state.name} you lost the game. The word was ${state.word.join(
          ''
        )}`
      ),
      T.map(constFalse)
    )
  } else if (state.word.includes(guess)) {
    return pipe(putStrLn('You guessed correctly!'), T.map(constTrue))
  } else {
    return pipe(
      // tslint:disable-next-line: quotemark
      putStrLn("That's wrong. but keep trying!"),
      T.map(constTrue)
    )
  }
}

const loop = (oldState: State): T.Task<State> =>
  pipe(
    T.Do,
    T.bind('guess', () => getGuess),
    T.bind('state', ({ guess }) => T.of(addGuess(oldState, guess))),
    T.chainFirst(({ state }) => render(state)),
    T.bind('doLoop', ({ state, guess }) => doLoop(state, guess)),
    T.chain(({ doLoop, state }) => (doLoop ? loop(state) : T.of(state)))
  )

const hangman: T.Task<void> = pipe(
  T.Do,
  T.chainFirst(() => putStrLn('Welcome to purely functional hangman')),
  T.bind('name', () => getName),
  T.chainFirst(({ name }) => putStrLn(`Welcome ${name}. Let's begin!`)),
  T.bind('word', () => chooseWord),
  T.bind('state', ({ name, word }) => T.of(newState(name, word))),
  T.chainFirst(({ state }) => render(state)),
  T.chain(({ state }) => loop(state)),
  T.map(constUndefined)
)

hangman()

function getDictionary(): ReadonlyArray<string> {
  return `ability
able
about
above
accept
according
account
across
act
action
activity
actually
add
address
administration
admit
adult
affect
after
again
against
age
agency
agent
ago
agree
agreement
ahead
air
all
allow
almost
alone
along
already
also
although
always
American
among
amount
analysis
and
animal
another
answer
any
anyone
anything
appear
apply
approach
area
argue
arm
around
arrive
art
article
artist
as
ask
assume
at
attack
attention
attorney
audience
author
authority
available
avoid
away
baby
back
bad
bag
ball
bank
bar
base
be
beat
beautiful
because
become
bed
before
begin
behavior
behind
believe
benefit
best
better
between
beyond
big
bill
billion
bit
black
blood
blue
board
body
book
born
both
box
boy
break
bring
brother
budget
build
building
business
but
buy
by
call
camera
campaign
can
cancer
candidate
capital
car
card
care
career
carry
case
catch
cause
cell
center
central
century
certain
certainly
chair
challenge
chance
change
character
charge
check
child
choice
choose
church
citizen
city
civil
claim
class
clear
clearly
close
coach
cold
collection
college
color
come
commercial
common
community
company
compare
computer
concern
condition
conference
Congress
consider
consumer
contain
continue
control
cost
could
country
couple
course
court
cover
create
crime
cultural
culture
cup
current
customer
cut
dark
data
daughter
day
dead
deal
death
debate
decade
decide
decision
deep
defense
degree
Democrat
democratic
describe
design
despite
detail
determine
develop
development
die
difference
different
difficult
dinner
direction
director
discover
discuss
discussion
disease
do
doctor
dog
door
down
draw
dream
drive
drop
drug
during
each
early
east
easy
eat
economic
economy
edge
education
effect
effort
eight
either
election
else
employee
end
energy
enjoy
enough
enter
entire
environment
environmental
especially
establish
even
evening
event
ever
every
everybody
everyone
everything
evidence
exactly
example
executive
exist
expect
experience
expert
explain
eye
face
fact
factor
fail
fall
family
far
fast
father
fear
federal
feel
feeling
few
field
fight
figure
fill
film
final
finally
financial
find
fine
finger
finish
fire
firm
first
fish
five
floor
fly
focus
follow
food
foot
for
force
foreign
forget
form
former
forward
four
free
friend
from
front
full
fund
future
game
garden
gas
general
generation
get
girl
give
glass
go
goal
good
government
great
green
ground
group
grow
growth
guess
gun
guy
hair
half
hand
hang
happen
happy
hard
have
he
head
health
hear
heart
heat
heavy
help
her
here
herself
high
him
himself
his
history
hit
hold
home
hope
hospital
hot
hotel
hour
house
how
however
huge
human
hundred
husband
I
idea
identify
if
image
imagine
impact
important
improve
in
include
including
increase
indeed
indicate
individual
industry
information
inside
instead
institution
interest
interesting
international
interview
into
investment
involve
issue
it
item
its
itself
job
join
just
keep
key
kid
kill
kind
kitchen
know
knowledge
land
language
large
last
late
later
laugh
law
lawyer
lay
lead
leader
learn
least
leave
left
leg
legal
less
let
letter
level
lie
life
light
like
likely
line
list
listen
little
live
local
long
look
lose
loss
lot
love
low
machine
magazine
main
maintain
major
majority
make
man
manage
management
manager
many
market
marriage
material
matter
may
maybe
me
mean
measure
media
medical
meet
meeting
member
memory
mention
message
method
middle
might
military
million
mind
minute
miss
mission
model
modern
moment
money
month
more
morning
most
mother
mouth
move
movement
movie
Mr
Mrs
much
music
must
my
myself
name
nation
national
natural
nature
near
nearly
necessary
need
network
never
new
news
newspaper
next
nice
night
no
none
nor
north
not
note
nothing
notice
now
n't
number
occur
of
off
offer
office
officer
official
often
oh
oil
ok
old
on
once
one
only
onto
open
operation
opportunity
option
or
order
organization
other
others
our
out
outside
over
own
owner
page
pain
painting
paper
parent
part
participant
particular
particularly
partner
party
pass
past
patient
pattern
pay
peace
people
per
perform
performance
perhaps
period
person
personal
phone
physical
pick
picture
piece
place
plan
plant
play
player
PM
point
police
policy
political
politics
poor
popular
population
position
positive
possible
power
practice
prepare
present
president
pressure
pretty
prevent
price
private
probably
problem
process
produce
product
production
professional
professor
program
project
property
protect
prove
provide
public
pull
purpose
push
put
quality
question
quickly
quite
race
radio
raise
range
rate
rather
reach
read
ready
real
reality
realize
really
reason
receive
recent
recently
recognize
record
red
reduce
reflect
region
relate
relationship
religious
remain
remember
remove
report
represent
Republican
require
research
resource
respond
response
responsibility
rest
result
return
reveal
rich
right
rise
risk
road
rock
role
room
rule
run
safe
same
save
say
scene
school
science
scientist
score
sea
season
seat
second
section
security
see
seek
seem
sell
send
senior
sense
series
serious
serve
service
set
seven
several
sex
sexual
shake
share
she
shoot
short
shot
should
shoulder
show
side
sign
significant
similar
simple
simply
since
sing
single
sister
sit
site
situation
six
size
skill
skin
small
smile
so
social
society
soldier
some
somebody
someone
something
sometimes
son
song
soon
sort
sound
source
south
southern
space
speak
special
specific
speech
spend
sport
spring
staff
stage
stand
standard
star
start
state
statement
station
stay
step
still
stock
stop
store
story
strategy
street
strong
structure
student
study
stuff
style
subject
success
successful
such
suddenly
suffer
suggest
summer
support
sure
surface
system
table
take
talk
task
tax
teach
teacher
team
technology
television
tell
ten
tend
term
test
than
thank
that
the
their
them
themselves
then
theory
there
these
they
thing
think
third
this
those
though
thought
thousand
threat
three
through
throughout
throw
thus
time
to
today
together
tonight
too
top
total
tough
toward
town
trade
traditional
training
travel
treat
treatment
tree
trial
trip
trouble
true
truth
try
turn
TV
two
type
under
understand
unit
until
up
upon
us
use
usually
value
various
very
victim
view
violence
visit
voice
vote
wait
walk
wall
want
war
watch
water
way
we
weapon
wear
week
weight
well
west
western
what
whatever
when
where
whether
which
while
white
who
whole
whom
whose
why
wide
wife
will
win
wind
window
wish
with
within
without
woman
wonder
word
work
worker
world
worry
would
write
writer
wrong
yard
yeah
year
yes
yet
you
young
your
yourself`.split('\n')
}
