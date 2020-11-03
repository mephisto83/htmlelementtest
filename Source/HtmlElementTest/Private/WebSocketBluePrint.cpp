// Fill out your copyright notice in the Description page of Project Settings.


#include "WebSocketBluePrint.h"
#include "WebSocketsModule.h" // Module definition
#include "IWebSocket.h"       // Socket definition

// MyProjectGameInstance.cpp
void UWebSocketBluePrint::Init()
{
    Super::Init();

    // Load the WebSockets module. An assertion will fail if it isn't found.
    FWebSocketsModule& Module = FModuleManager::LoadModuleChecked(TEXT("WebSockets"));
}