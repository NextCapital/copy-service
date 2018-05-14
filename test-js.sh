#!/usr/bin/env bash

RED='\033[0;31m'
NC='\033[0m'  # no color

if cd js;
then
  echo -e "\n🏗  Testing the copy-service package... 🏗"
else
  echo -e "\n⚠️  ${RED}Error:${NC} copy-service not found!\n"
  exit 1;
fi
npm run test || exit 1

if cd evaluators/plain-text-evaluator;
then
  echo -e "\n🏗  Testing the plain-text-evaluator package... 🏗"
else
  echo -e "\n⚠️  ${RED}Error:${NC} evaluators/plain-text-evaluator not found!\n"
  exit 1;
fi
npm run test || exit 1

if cd ../react-evaluator;
then
  echo -e "\n🏗  Testing the react-evaluator package... 🏗"
else
  echo -e "\n⚠️  ${RED}Error:${NC} evaluators/react-evaluator not found!\n"
  exit 1;
fi
npm run test || exit 1
