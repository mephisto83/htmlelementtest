// Fill out your copyright notice in the Description page of Project Settings.

#pragma once

#include "CoreMinimal.h"
#include "Kismet/BlueprintFunctionLibrary.h"
#include "WebSocketBluePrint.generated.h"

/**
 * 
 */
UCLASS()
class HTMLELEMENTTEST_API UWebSocketBluePrint : public UBlueprintFunctionLibrary
{
	GENERATED_BODY()
public:
	virtual void Init() override;
	
};
